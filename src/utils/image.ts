import type { OutputSettings } from '../types';
import type { TransparencyResult } from '../types';

export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.src = dataUrl;
  });
}

export function enforceOriginalDimensions(
  dataUrl: string,
  targetWidth: number,
  targetHeight: number
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      if (img.width === targetWidth && img.height === targetHeight) {
        resolve(dataUrl);
        return;
      }
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, targetWidth, targetHeight);
      const scale = Math.min(targetWidth / img.width, targetHeight / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      const offsetX = (targetWidth - scaledWidth) / 2;
      const offsetY = (targetHeight - scaledHeight) / 2;
      ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
      resolve(canvas.toDataURL('image/png'));
    };
    img.src = dataUrl;
  });
}

export function applyOutputSettings(
  dataUrl: string,
  _originalImg: { width: number; height: number },
  settings: OutputSettings
): Promise<string> {
  const { sizeMode, customWidth, customHeight, lockRatio, scalePercent, outputFormat } = settings;
  if (sizeMode === 'original') return Promise.resolve(dataUrl);

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let targetWidth: number;
      let targetHeight: number;
      if (sizeMode === 'custom') {
        targetWidth = parseInt(customWidth, 10) || img.width;
        targetHeight = parseInt(customHeight, 10) || img.height;
        if (lockRatio) {
          const ratio = img.width / img.height;
          if (targetWidth / targetHeight > ratio) {
            targetWidth = Math.round(targetHeight * ratio);
          } else {
            targetHeight = Math.round(targetWidth / ratio);
          }
        }
      } else if (sizeMode === 'scale') {
        const scale = (parseInt(String(scalePercent), 10) || 100) / 100;
        targetWidth = Math.round(img.width * scale);
        targetHeight = Math.round(img.height * scale);
      } else {
        resolve(dataUrl);
        return;
      }
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      const mimeType = outputFormat === 'webp' ? 'image/webp' : 'image/png';
      resolve(canvas.toDataURL(mimeType));
    };
    img.src = dataUrl;
  });
}

export function checkTransparencyDataUrl(dataUrl: string): Promise<TransparencyResult> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      let transparentPixels = 0,
        semiTransparentPixels = 0,
        opaquePixels = 0;
      const totalPixels = canvas.width * canvas.height;
      const corners = [
        0,
        (canvas.width - 1) * 4,
        (canvas.height - 1) * canvas.width * 4,
        ((canvas.height - 1) * canvas.width + canvas.width - 1) * 4,
      ];
      const cornerAlphas = corners.map((i) => data[i + 3]);
      for (let i = 3; i < data.length; i += 4) {
        const alpha = data[i];
        if (alpha === 0) transparentPixels++;
        else if (alpha === 255) opaquePixels++;
        else semiTransparentPixels++;
      }
      resolve({
        width: canvas.width,
        height: canvas.height,
        totalPixels,
        transparentPixels,
        semiTransparentPixels,
        opaquePixels,
        cornerAlphas,
      });
    };
    img.src = dataUrl;
  });
}
