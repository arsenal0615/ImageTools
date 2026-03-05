import type { GeminiAPIParams } from '../types';

export async function callGeminiAPI({
  apiKey,
  model,
  prompt,
  imageData,
  mimeType,
}: GeminiAPIParams): Promise<string> {
  const base64Data = imageData.split(',')[1];
  const requestBody = {
    contents: [
      {
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data: base64Data } },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
    },
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
    if (response.status === 401 || response.status === 403) {
      throw new Error('API Key 无效或权限不足，请检查 Key 是否正确');
    }
    if (response.status === 429) {
      throw new Error('API 调用频率超限，请降低并发或稍后重试');
    }
    if (response.status === 503) {
      throw new Error('模型服务器繁忙，请稍后点击重试，或切换其他模型');
    }
    if (response.status === 400) {
      throw new Error('请求参数错误: ' + (errorData.error?.message || '未知错误'));
    }
    throw new Error(`API 错误 (${response.status}): ${errorData.error?.message || '未知错误'}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ inlineData?: { mimeType?: string; data?: string } }>;
      };
    }>;
  };
  if (data.candidates?.[0]?.content?.parts) {
    for (const part of data.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      }
    }
  }
  throw new Error('API 响应中没有找到图片数据');
}
