export function extractFramesFromVideo(file: File, fps: number): Promise<File[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    video.src = url;
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      const duration = video.duration;
      const width = video.videoWidth;
      const height = video.videoHeight;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        URL.revokeObjectURL(url);
        return reject(new Error('Failed to get canvas context'));
      }

      const frames: File[] = [];
      const interval = 1 / fps;
      let currentTime = 0;

      video.onseeked = () => {
        ctx.drawImage(video, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) {
            const index = frames.length + 1;
            const padIndex = String(index).padStart(4, '0');
            const fileName = `${file.name.replace(/\.[^/.]+$/, '')}_frame_${padIndex}.png`;
            const frameFile = new File([blob], fileName, { type: 'image/png' });
            frames.push(frameFile);
          }

          currentTime += interval;
          if (currentTime <= duration) {
            video.currentTime = currentTime;
          } else {
            URL.revokeObjectURL(url);
            resolve(frames);
          }
        }, 'image/png');
      };

      video.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(e);
      };

      // 触发第一次seek
      video.currentTime = currentTime;
    };

    video.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
  });
}
