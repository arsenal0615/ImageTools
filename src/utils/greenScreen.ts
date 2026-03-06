/**
 * 绿幕后处理工具
 * 使用色度键（Chroma Key）技术将绿幕背景转换为透明背景
 */

export interface GreenScreenSettings {
  /** 是否启用绿幕处理 */
  enabled: boolean;
  /** 目标颜色 (hex 格式，如 #00FF00) */
  keyColor: string;
  /** 颜色相似度阈值 (0-1)，越大容差越高 */
  similarity: number;
  /** 平滑度/溢出抑制 (0-1) */
  smoothness: number;
  /** 边缘羽化强度 (0-10) */
  featherRadius: number;
  /** 边缘收缩/扩展 (-10 到 10) */
  edgeShift: number;
  /** 溢色抑制强度 (0-1) */
  spillSuppression: number;
}

export const DEFAULT_GREEN_SCREEN_SETTINGS: GreenScreenSettings = {
  enabled: false,
  keyColor: '#00FF00',
  similarity: 0.6,
  smoothness: 0.0,
  featherRadius: 2,
  edgeShift: -2,
  spillSuppression: 1,
};

/**
 * 将 hex 颜色转换为 RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return { r: 0, g: 255, b: 0 }; // 默认绿色
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * RGB 转 YCbCr 色彩空间（用于更好的色度键计算）
 */
function rgbToYCbCr(r: number, g: number, b: number): { y: number; cb: number; cr: number } {
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
  return { y, cb, cr };
}

/**
 * 计算两个颜色在 YCbCr 空间中的色度距离
 */
function chromaDistance(
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number
): number {
  const c1 = rgbToYCbCr(r1, g1, b1);
  const c2 = rgbToYCbCr(r2, g2, b2);
  
  // 只比较色度分量 (Cb, Cr)，忽略亮度 (Y)
  const dCb = c1.cb - c2.cb;
  const dCr = c1.cr - c2.cr;
  
  return Math.sqrt(dCb * dCb + dCr * dCr) / 181.02; // 归一化到 0-1
}

/**
 * 计算像素的 alpha 值（基于色度键）
 */
function calculateAlpha(
  r: number, g: number, b: number,
  keyR: number, keyG: number, keyB: number,
  similarity: number,
  smoothness: number
): number {
  const distance = chromaDistance(r, g, b, keyR, keyG, keyB);
  
  // similarity 控制完全透明的阈值
  // smoothness 控制从透明到不透明的过渡范围
  const threshold = similarity;
  const transitionWidth = smoothness;
  
  if (distance < threshold) {
    return 0; // 完全透明
  } else if (distance < threshold + transitionWidth) {
    // 平滑过渡区域
    return (distance - threshold) / transitionWidth;
  } else {
    return 1; // 完全不透明
  }
}

/**
 * 抑制绿色溢出（去除主体边缘的绿色反光）
 */
function suppressSpill(
  r: number, g: number, b: number,
  _keyR: number, _keyG: number, _keyB: number,
  strength: number
): { r: number; g: number; b: number } {
  if (strength <= 0) return { r, g, b };
  
  // 检测绿色溢出：当绿色通道明显高于红蓝平均值时
  // 注：keyR/keyG/keyB 保留用于未来更精确的溢色抑制算法
  const avgRB = (r + b) / 2;
  const greenExcess = g - avgRB;
  
  if (greenExcess > 0) {
    // 减少绿色溢出
    const suppression = greenExcess * strength;
    return {
      r: Math.min(255, r + suppression * 0.5),
      g: Math.max(0, g - suppression),
      b: Math.min(255, b + suppression * 0.5),
    };
  }
  
  return { r, g, b };
}

/**
 * 应用高斯模糊到 alpha 通道（用于边缘羽化）
 */
function applyGaussianBlurToAlpha(
  imageData: ImageData,
  radius: number
): void {
  if (radius <= 0) return;
  
  const { width, height, data } = imageData;
  const alphaChannel = new Float32Array(width * height);
  
  // 提取 alpha 通道
  for (let i = 0; i < width * height; i++) {
    alphaChannel[i] = data[i * 4 + 3] / 255;
  }
  
  // 创建高斯核
  const kernelSize = Math.ceil(radius * 2) * 2 + 1;
  const kernel = new Float32Array(kernelSize);
  const sigma = radius / 2;
  let sum = 0;
  
  for (let i = 0; i < kernelSize; i++) {
    const x = i - Math.floor(kernelSize / 2);
    kernel[i] = Math.exp(-(x * x) / (2 * sigma * sigma));
    sum += kernel[i];
  }
  
  // 归一化
  for (let i = 0; i < kernelSize; i++) {
    kernel[i] /= sum;
  }
  
  // 水平方向模糊
  const temp = new Float32Array(width * height);
  const halfKernel = Math.floor(kernelSize / 2);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let value = 0;
      for (let k = 0; k < kernelSize; k++) {
        const sx = Math.min(Math.max(x + k - halfKernel, 0), width - 1);
        value += alphaChannel[y * width + sx] * kernel[k];
      }
      temp[y * width + x] = value;
    }
  }
  
  // 垂直方向模糊
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let value = 0;
      for (let k = 0; k < kernelSize; k++) {
        const sy = Math.min(Math.max(y + k - halfKernel, 0), height - 1);
        value += temp[sy * width + x] * kernel[k];
      }
      alphaChannel[y * width + x] = value;
    }
  }
  
  // 写回 alpha 通道
  for (let i = 0; i < width * height; i++) {
    data[i * 4 + 3] = Math.round(alphaChannel[i] * 255);
  }
}

/**
 * 边缘收缩/扩展（腐蚀/膨胀）
 */
function applyEdgeShift(
  imageData: ImageData,
  shift: number
): void {
  if (shift === 0) return;
  
  const { width, height, data } = imageData;
  const alphaChannel = new Uint8Array(width * height);
  
  // 提取 alpha 通道
  for (let i = 0; i < width * height; i++) {
    alphaChannel[i] = data[i * 4 + 3];
  }
  
  const result = new Uint8Array(width * height);
  const radius = Math.abs(Math.round(shift));
  const isErode = shift < 0; // 负值为腐蚀（收缩），正值为膨胀（扩展）
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let extremeValue = isErode ? 255 : 0;
      
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          // 圆形结构元素
          if (dx * dx + dy * dy > radius * radius) continue;
          
          const nx = Math.min(Math.max(x + dx, 0), width - 1);
          const ny = Math.min(Math.max(y + dy, 0), height - 1);
          const neighborAlpha = alphaChannel[ny * width + nx];
          
          if (isErode) {
            extremeValue = Math.min(extremeValue, neighborAlpha);
          } else {
            extremeValue = Math.max(extremeValue, neighborAlpha);
          }
        }
      }
      
      result[y * width + x] = extremeValue;
    }
  }
  
  // 写回 alpha 通道
  for (let i = 0; i < width * height; i++) {
    data[i * 4 + 3] = result[i];
  }
}

/**
 * 主处理函数：将绿幕图像转换为透明背景
 */
export function processGreenScreen(
  dataUrl: string,
  settings: GreenScreenSettings
): Promise<string> {
  return new Promise((resolve) => {
    if (!settings.enabled) {
      resolve(dataUrl);
      return;
    }
    
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const { data } = imageData;
      
      const keyColor = hexToRgb(settings.keyColor);
      
      // 第一步：计算每个像素的 alpha 值
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // 计算 alpha
        const alpha = calculateAlpha(
          r, g, b,
          keyColor.r, keyColor.g, keyColor.b,
          settings.similarity,
          settings.smoothness
        );
        
        // 应用溢色抑制
        if (alpha > 0 && settings.spillSuppression > 0) {
          const corrected = suppressSpill(
            r, g, b,
            keyColor.r, keyColor.g, keyColor.b,
            settings.spillSuppression
          );
          data[i] = corrected.r;
          data[i + 1] = corrected.g;
          data[i + 2] = corrected.b;
        }
        
        data[i + 3] = Math.round(alpha * 255);
      }
      
      // 第二步：边缘收缩/扩展
      if (settings.edgeShift !== 0) {
        applyEdgeShift(imageData, settings.edgeShift);
      }
      
      // 第三步：边缘羽化
      if (settings.featherRadius > 0) {
        applyGaussianBlurToAlpha(imageData, settings.featherRadius);
      }
      
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    
    img.src = dataUrl;
  });
}

/**
 * 批量处理多张图片
 */
export async function processGreenScreenBatch(
  dataUrls: string[],
  settings: GreenScreenSettings,
  onProgress?: (current: number, total: number) => void
): Promise<string[]> {
  const results: string[] = [];
  
  for (let i = 0; i < dataUrls.length; i++) {
    const result = await processGreenScreen(dataUrls[i], settings);
    results.push(result);
    onProgress?.(i + 1, dataUrls.length);
  }
  
  return results;
}

/**
 * 预览处理效果（只处理单张图片的一部分用于快速预览）
 */
export function previewGreenScreen(
  dataUrl: string,
  settings: GreenScreenSettings
): Promise<string> {
  return processGreenScreen(dataUrl, settings);
}
