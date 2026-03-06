import type { GeminiAPIParams } from '../types';

// Gemini API 的限制（实际限制可能更严格，使用保守值）
const MAX_IMAGE_SIZE_MB = 1; // 保守设置为 1MB，避免 413 错误
const MAX_IMAGE_DIMENSION = 1024; // 最大边长 1024px，减少数据量

/**
 * 检查图片大小并返回信息
 */
function getImageInfo(base64Data: string): { sizeKB: number; sizeMB: number } {
  // base64 编码后大小约为原始大小的 4/3
  const sizeBytes = (base64Data.length * 3) / 4;
  const sizeKB = sizeBytes / 1024;
  const sizeMB = sizeKB / 1024;
  return { sizeKB, sizeMB };
}

/**
 * 压缩图片以满足 API 限制
 */
function compressImage(
  imageData: string, 
  maxDimension: number = MAX_IMAGE_DIMENSION
): Promise<{ data: string; mimeType: string; compressed: boolean; width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // 计算新尺寸
      let newWidth = img.width;
      let newHeight = img.height;
      
      // 如果任一边超过限制，按比例缩放
      if (img.width > maxDimension || img.height > maxDimension) {
        const scale = Math.min(maxDimension / img.width, maxDimension / img.height);
        newWidth = Math.round(img.width * scale);
        newHeight = Math.round(img.height * scale);
      }
      
      // 创建 canvas
      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      
      // 直接使用 JPEG 格式，更小的体积
      let quality = 0.85;
      let result = canvas.toDataURL('image/jpeg', quality);
      let info = getImageInfo(result.split(',')[1]);
      
      // 如果还是太大，继续降低质量
      while (info.sizeMB > MAX_IMAGE_SIZE_MB && quality > 0.3) {
        quality -= 0.1;
        result = canvas.toDataURL('image/jpeg', quality);
        info = getImageInfo(result.split(',')[1]);
      }
      
      // 如果质量降到很低还是太大，进一步缩小尺寸
      if (info.sizeMB > MAX_IMAGE_SIZE_MB) {
        const furtherScale = 0.7;
        canvas.width = Math.round(newWidth * furtherScale);
        canvas.height = Math.round(newHeight * furtherScale);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        result = canvas.toDataURL('image/jpeg', 0.7);
        info = getImageInfo(result.split(',')[1]);
        newWidth = canvas.width;
        newHeight = canvas.height;
      }
      
      console.log(`图片压缩: ${img.width}x${img.height} -> ${newWidth}x${newHeight}, 大小: ${info.sizeMB.toFixed(2)}MB`);
      
      resolve({ 
        data: result, 
        mimeType: 'image/jpeg', 
        compressed: true,
        width: newWidth,
        height: newHeight
      });
    };
    img.onerror = () => {
      resolve({ data: imageData, mimeType: 'image/png', compressed: false, width: 0, height: 0 });
    };
    img.src = imageData;
  });
}

export async function callGeminiAPI({
  apiKey,
  model,
  prompt,
  imageData,
  mimeType: _originalMimeType,
}: GeminiAPIParams): Promise<string> {
  // 检查原始图片大小
  const originalBase64 = imageData.split(',')[1];
  const originalInfo = getImageInfo(originalBase64);
  
  // 总是进行压缩处理，确保图片大小在限制内
  console.log(`原始图片大小: ${originalInfo.sizeMB.toFixed(2)}MB`);
  const compressed = await compressImage(imageData);
  const finalBase64 = compressed.data.split(',')[1];
  const finalMimeType = compressed.mimeType;
  const finalInfo = getImageInfo(finalBase64);
  console.log(`处理后图片大小: ${finalInfo.sizeMB.toFixed(2)}MB`);
  
  const requestBody = {
    contents: [
      {
        parts: [
          { text: prompt },
          { inlineData: { mimeType: finalMimeType, data: finalBase64 } },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ['IMAGE'],
    },
  };

  let response: Response;
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }
    );
  } catch (fetchError) {
    const errorMsg = fetchError instanceof Error ? fetchError.message : '未知网络错误';
    if (errorMsg.includes('Failed to fetch')) {
      throw new Error(`网络连接失败，请检查：\n1. 网络是否正常\n2. 是否需要代理访问 Google API\n3. 图片大小: ${finalInfo.sizeMB.toFixed(2)}MB`);
    }
    throw new Error(`网络请求失败: ${errorMsg}`);
  }

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as { 
      error?: { 
        message?: string;
        code?: number;
        status?: string;
      } 
    };
    
    const errorMessage = errorData.error?.message || '未知错误';
    const errorStatus = errorData.error?.status || '';
    
    if (response.status === 401 || response.status === 403) {
      throw new Error('API Key 无效或权限不足，请检查 Key 是否正确');
    }
    if (response.status === 429) {
      throw new Error('API 调用频率超限，请降低并发或稍后重试');
    }
    if (response.status === 503) {
      throw new Error('模型服务器繁忙，请稍后点击重试，或切换其他模型');
    }
    if (response.status === 413) {
      throw new Error(`图片太大 (${finalInfo.sizeMB.toFixed(2)}MB)，请使用更小的图片\n原始大小: ${originalInfo.sizeMB.toFixed(2)}MB`);
    }
    if (response.status === 400) {
      // 更详细的 400 错误分析
      if (errorMessage.includes('image') || errorMessage.includes('size') || errorMessage.includes('large')) {
        throw new Error(`图片处理失败: ${errorMessage}\n当前图片大小: ${finalInfo.sizeMB.toFixed(2)}MB\n建议：尝试使用更小的图片`);
      }
      if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
        throw new Error(`API 配额不足: ${errorMessage}`);
      }
      throw new Error(`请求参数错误: ${errorMessage}`);
    }
    if (response.status === 404) {
      throw new Error(`模型不存在: ${model}\n请在设置中选择其他模型`);
    }
    if (response.status === 500) {
      throw new Error(`服务器内部错误，请稍后重试\n详情: ${errorMessage}`);
    }
    
    throw new Error(`API 错误 (${response.status} ${errorStatus}): ${errorMessage}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ 
          inlineData?: { mimeType?: string; data?: string };
          text?: string;
        }>;
      };
      finishReason?: string;
      safetyRatings?: Array<{ category: string; probability: string }>;
    }>;
    promptFeedback?: {
      blockReason?: string;
      safetyRatings?: Array<{ category: string; probability: string }>;
    };
  };
  
  // 检查是否被安全过滤器阻止
  if (data.promptFeedback?.blockReason) {
    throw new Error(`内容被安全过滤器阻止: ${data.promptFeedback.blockReason}`);
  }
  
  // 检查完成原因
  const finishReason = data.candidates?.[0]?.finishReason;
  if (finishReason && finishReason !== 'STOP') {
    if (finishReason === 'SAFETY') {
      throw new Error('生成的内容被安全过滤器阻止，请尝试其他图片');
    }
    if (finishReason === 'MAX_TOKENS') {
      throw new Error('生成内容超出长度限制');
    }
    if (finishReason === 'RECITATION') {
      throw new Error('内容可能涉及版权问题');
    }
  }
  
  if (data.candidates?.[0]?.content?.parts) {
    for (const part of data.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      }
    }
    
    // 如果只有文本响应，说明模型可能不支持图像生成
    const textPart = data.candidates[0].content.parts.find(p => p.text);
    if (textPart?.text) {
      throw new Error(`模型返回了文本而非图片，可能不支持图像生成。\n模型响应: ${textPart.text.slice(0, 100)}...`);
    }
  }
  
  throw new Error('API 响应中没有找到图片数据，请检查模型是否支持图像生成');
}
