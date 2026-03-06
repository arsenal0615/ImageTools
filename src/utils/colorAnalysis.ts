/**
 * AI 智能选色工具
 * 分析图片颜色，推荐最佳抠图背景色
 */

export interface ColorRecommendation {
  /** 推荐的背景色 (hex 格式) */
  color: string;
  /** 颜色名称 */
  colorName: string;
  /** 推荐理由 */
  reason: string;
  /** 置信度 (0-100) */
  confidence: number;
}

export interface ColorAnalysisResult {
  /** 推荐的颜色列表 */
  recommendations: ColorRecommendation[];
  /** 最佳推荐 */
  bestChoice: ColorRecommendation;
  /** 分析说明 */
  analysis: string;
}

const DEFAULT_COLOR_ANALYSIS_PROMPT = `分析这张图片，为抠图选择最佳的背景色。

要求：
1. 仔细分析图片中主体使用的所有颜色（包括高光、阴影、边缘颜色）
2. 找出一个与主体所有颜色差异都足够大的纯色作为抠图背景色
3. 绝对避免选择图片中已经存在的颜色，即使只是小面积存在
4. 从以下备选色中选择最合适的（按类别分组）：

【绿色系】适合大多数场景
   - #00FF00 标准绿幕（最常用）
   - #00FF7F 春绿色
   - #7FFF00 草绿色
   - #32CD32 酸橙绿
   - #98FB98 淡绿色
   - #ADFF2F 绿黄色
   - #00FA9A 中春绿

【蓝色系】适合暖色调主体
   - #0000FF 标准蓝幕
   - #00BFFF 深天蓝
   - #1E90FF 道奇蓝
   - #4169E1 皇家蓝
   - #87CEEB 天蓝色
   - #6495ED 矢车菊蓝
   - #4682B4 钢蓝色
   - #0080FF 亮蓝色

【品红/紫色系】适合绿色主体
   - #FF00FF 品红（洋红）
   - #FF1493 深粉红
   - #EE82EE 紫罗兰
   - #DA70D6 兰花紫
   - #9932CC 暗兰紫
   - #BA55D3 中兰紫
   - #8B008B 暗品红
   - #FF69B4 热粉红

【黄色/橙色系】适合蓝紫色主体
   - #FFFF00 纯黄色
   - #FFD700 金色
   - #FFA500 橙色
   - #FF8C00 深橙色
   - #FF6347 番茄红
   - #FFE135 香蕉黄
   - #FFBF00 琥珀色
   - #FF7F50 珊瑚色

【青色系】适合红橙色主体
   - #00FFFF 青色
   - #00CED1 暗青色
   - #20B2AA 浅海绿
   - #40E0D0 绿松石色
   - #48D1CC 中绿松石色
   - #7FFFD4 碧绿色
   - #66CDAA 中碧绿色
   - #5F9EA0 军服蓝

【红色系】适合青绿色主体
   - #FF0000 纯红色
   - #DC143C 猩红色
   - #B22222 耐火砖红
   - #CD5C5C 印度红
   - #FF4500 橙红色
   - #FF6B6B 浅珊瑚红

【中性色】特定场景使用
   - #FFFFFF 纯白色（适合深色主体）
   - #000000 纯黑色（适合浅色主体）
   - #808080 中灰色
   - #C0C0C0 银色
   - #A9A9A9 暗灰色

【粉色系】适合绿色/深色主体
   - #FFC0CB 粉红色
   - #FFB6C1 浅粉红
   - #FF69B4 热粉红
   - #DB7093 苍紫罗兰红

5. 如果上述颜色都不理想，可以自行推荐最优颜色

请以 JSON 格式返回结果，格式如下：
{
  "bestChoice": {
    "color": "#XXXXXX",
    "colorName": "颜色名称",
    "reason": "选择这个颜色的原因（说明为什么这个颜色与主体颜色差异最大）",
    "confidence": 85
  },
  "recommendations": [
    {
      "color": "#XXXXXX",
      "colorName": "颜色名称", 
      "reason": "原因",
      "confidence": 85
    },
    {
      "color": "#XXXXXX",
      "colorName": "备选颜色2",
      "reason": "原因",
      "confidence": 75
    },
    {
      "color": "#XXXXXX", 
      "colorName": "备选颜色3",
      "reason": "原因",
      "confidence": 65
    }
  ],
  "analysis": "对图片主体颜色的详细分析，说明主体包含哪些颜色，为什么选择的背景色能与之形成最大对比"
}

只返回 JSON，不要其他内容。`;

// 用于颜色分析的模型（按优先级排序，优先使用 Gemini 3.x 系列）
const COLOR_ANALYSIS_MODELS = [
  'gemini-3.1-flash-image-preview',         // Gemini 3.1 图像版
  'gemini-3-pro-image-preview',             // Gemini 3 Pro 图像版
  'gemini-3.1-pro-preview',                 // Gemini 3.1 Pro
  'gemini-3-flash-preview',                 // Gemini 3 Flash
  'gemini-2.5-flash',                       // Gemini 2.5 Flash
  'gemini-2.0-flash-exp-image-generation',  // 备选：图像生成模型
];

// 颜色分析用的最大图片尺寸（分析颜色不需要高分辨率）
const MAX_ANALYSIS_SIZE = 512;

/**
 * 压缩图片用于颜色分析（降低分辨率以减少数据量）
 */
function compressImageForAnalysis(imageData: string, maxSize: number = MAX_ANALYSIS_SIZE): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // 如果图片已经足够小，直接返回
      if (img.width <= maxSize && img.height <= maxSize) {
        resolve(imageData);
        return;
      }
      
      // 计算缩放比例
      const scale = Math.min(maxSize / img.width, maxSize / img.height);
      const newWidth = Math.round(img.width * scale);
      const newHeight = Math.round(img.height * scale);
      
      // 创建 canvas 并绘制缩放后的图片
      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      
      // 返回压缩后的图片（使用 JPEG 格式进一步减小体积）
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => {
      // 如果加载失败，返回原图
      resolve(imageData);
    };
    img.src = imageData;
  });
}

/**
 * 调用 AI 分析图片颜色并推荐抠图背景色
 */
export async function analyzeImageColors(
  apiKey: string,
  _model: string, // 忽略传入的模型，使用专门的分析模型
  imageData: string,
  _mimeType: string,
  customPrompt?: string
): Promise<ColorAnalysisResult> {
  const prompt = customPrompt || DEFAULT_COLOR_ANALYSIS_PROMPT;
  
  // 压缩图片以减少数据量（颜色分析不需要高分辨率）
  const compressedImage = await compressImageForAnalysis(imageData);
  const base64Data = compressedImage.split(',')[1];
  // 压缩后统一使用 JPEG 格式
  const mimeType = compressedImage.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/png';
  
  // 尝试多个模型，直到成功
  let lastError: Error | null = null;
  
  for (const analysisModel of COLOR_ANALYSIS_MODELS) {
    try {
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
          temperature: 0.1, // 低温度，更稳定的输出
        },
      };

      let response: Response;
      try {
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${analysisModel}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
          }
        );
      } catch (fetchError) {
        // 网络错误
        throw new Error(`网络请求失败: ${fetchError instanceof Error ? fetchError.message : '无法连接到服务器'}`);
      }

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
        if (response.status === 404) {
          throw new Error(`模型 ${analysisModel} 不存在`);
        }
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = (await response.json()) as {
        candidates?: Array<{
          content?: {
            parts?: Array<{ text?: string }>;
          };
        }>;
      };
      
      const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textContent) {
        throw new Error('AI 没有返回分析结果');
      }

      // 解析结果
      return parseColorAnalysisResult(textContent);
      
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`模型 ${analysisModel} 分析失败:`, lastError.message);
      // 继续尝试下一个模型
    }
  }
  
  throw new Error(`所有模型都分析失败: ${lastError?.message || '未知错误'}`);
}

/**
 * 解析颜色分析结果
 */
function parseColorAnalysisResult(textContent: string): ColorAnalysisResult {

  try {
    // 尝试从文本中提取 JSON
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]) as ColorAnalysisResult;
      
      // 验证结果格式
      if (result.bestChoice?.color) {
        // 确保颜色格式正确
        result.bestChoice.color = normalizeHexColor(result.bestChoice.color);
        if (result.recommendations) {
          result.recommendations = result.recommendations.map(r => ({
            ...r,
            color: normalizeHexColor(r.color),
          }));
        } else {
          result.recommendations = [result.bestChoice];
        }
        
        return result;
      }
    }
  } catch (parseError) {
    // JSON 解析失败，继续尝试其他方式
    console.warn('JSON 解析失败，尝试提取颜色:', parseError);
  }
  
  // 如果 JSON 解析失败，尝试从文本中提取颜色
  const colorMatch = textContent.match(/#[0-9A-Fa-f]{6}/g);
  if (colorMatch && colorMatch.length > 0) {
    // 尝试提取颜色名称
    const colorNameMatch = textContent.match(/(?:推荐|建议|选择|使用)[：:]*\s*([^\n,，。.]+)/);
    const colorName = colorNameMatch ? colorNameMatch[1].trim() : '推荐色';
    
    return {
      bestChoice: {
        color: colorMatch[0].toUpperCase(),
        colorName: colorName,
        reason: textContent.slice(0, 200),
        confidence: 70,
      },
      recommendations: colorMatch.slice(0, 3).map((c, i) => ({
        color: c.toUpperCase(),
        colorName: i === 0 ? colorName : `备选色 ${i}`,
        reason: '',
        confidence: 70 - i * 10,
      })),
      analysis: textContent,
    };
  }
  
  throw new Error('无法从 AI 响应中提取颜色信息');
}

/**
 * 标准化 hex 颜色格式
 */
function normalizeHexColor(color: string): string {
  // 移除空格
  color = color.trim();
  
  // 确保以 # 开头
  if (!color.startsWith('#')) {
    color = '#' + color;
  }
  
  // 转换为大写
  color = color.toUpperCase();
  
  // 如果是 3 位简写，扩展为 6 位
  if (color.length === 4) {
    color = '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
  }
  
  // 验证格式
  if (!/^#[0-9A-F]{6}$/.test(color)) {
    return '#00FF00'; // 默认返回绿色
  }
  
  return color;
}

/**
 * 生成使用指定颜色的抠图提示词
 */
export function generatePromptWithColor(color: string, colorName: string): string {
  return `移除此图像的背景，将背景替换为纯色 ${color}（${colorName}）。

非常重要 - 请仔细阅读：

1. 将背景替换为纯色 ${color}，不要使用透明或棋盘格
2. 主体边缘需要自然过渡，保持轻微的边缘羽化效果
3. 保持主体与原来完全一致 - 不要修改、重绘或增强主体内容
4. 输出尺寸必须与输入尺寸完全一致
5. 保留主体的每一个像素，不作任何更改
6. 确保背景颜色均匀一致，便于后期处理

这是用于精灵图动画的抠图 - 任何对主体的修改都会破坏动画。
只需以像素级的精度保留主体，并将背景设置为纯色 ${color}。`;
}

/**
 * 默认的颜色分析提示词
 */
export const DEFAULT_COLOR_ANALYSIS_PROMPT_TEXT = DEFAULT_COLOR_ANALYSIS_PROMPT;

/**
 * 预设的备选颜色
 */
export const PRESET_COLORS = [
  { color: '#00FF00', name: '绿色（标准绿幕）' },
  { color: '#0000FF', name: '蓝色（标准蓝幕）' },
  { color: '#FF00FF', name: '品红' },
  { color: '#FFFF00', name: '黄色' },
  { color: '#00FFFF', name: '青色' },
  { color: '#FF8000', name: '橙色' },
  { color: '#FF0000', name: '红色' },
  { color: '#FFFFFF', name: '白色' },
  { color: '#000000', name: '黑色' },
];
