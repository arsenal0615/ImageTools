import { useApp } from '../context/AppContext';
import ImageCard from './ImageCard';
import { checkTransparencyDataUrl } from '../utils/image';

export default function ResultGrid() {
  const { state, retryImage, setPreviewCompare } = useApp();
  const { images, results } = state;

  const completed = images.filter((img) => results.has(img.id));
  if (completed.length === 0) {
    return (
      <div className="empty-state">
        <div className="icon">✨</div>
        <p>处理完成的图片将显示在这里</p>
      </div>
    );
  }

  return (
    <div className="image-grid">
      {images.map((img) => {
        const result = results.get(img.id);
        if (!result) return null;
        return (
          <ImageCard
            key={img.id}
            type="result"
            image={img}
            result={result}
            onPreview={() => setPreviewCompare({ original: img.data, result })}
            onRetry={() => retryImage(img.id)}
            onDownload={() => {
              const a = document.createElement('a');
              const baseName = img.name.replace(/\.[^/.]+$/, '');
              a.download = `${baseName}_nobg.png`;
              a.href = result;
              a.click();
            }}
            onCheckTransparency={() => {
              checkTransparencyDataUrl(result).then((data) => {
                const total = data.totalPixels;
                const tp = ((data.transparentPixels / total) * 100).toFixed(1);
                const sp = ((data.semiTransparentPixels / total) * 100).toFixed(1);
                const op = ((data.opaquePixels / total) * 100).toFixed(1);
                const cornerOk = data.cornerAlphas.every((a) => a === 0);
                const msg = `【${img.name} 透明度分析】\n尺寸: ${data.width}×${data.height}\n完全透明: ${tp}%\n半透明: ${sp}%\n不透明: ${op}%\n四角: ${cornerOk ? '✅ 完全透明' : '⚠️ 部分不透明'}\n${Number(tp) > 30 ? '✅ 背景已移除' : '⚠️ 可能存在残留背景'}`;
                alert(msg);
              });
            }}
          />
        );
      })}
    </div>
  );
}
