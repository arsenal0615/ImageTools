import { useApp } from '../context/AppContext';

export default function PostProcessGrid() {
  const { state, setPreviewCompare } = useApp();
  const { images, results, postProcessedResults } = state;

  // 获取有后处理结果的图片
  const processedImages = images.filter((img) => postProcessedResults.has(img.id));

  if (processedImages.length === 0) {
    return (
      <div className="empty-state">
        <div className="icon">🎬</div>
        <p>暂无后处理结果</p>
        <p className="hint">请先配置绿幕设置并点击"应用后处理"</p>
      </div>
    );
  }

  return (
    <div className="image-grid">
      {processedImages.map((img) => {
        const postProcessedUrl = postProcessedResults.get(img.id);
        const originalResultUrl = results.get(img.id);
        
        return (
          <div key={img.id} className="image-card">
            <div
              className="thumb-container"
              style={{ background: 'repeating-conic-gradient(#333 0% 25%, #444 0% 50%) 50% / 20px 20px' }}
            >
              <img src={postProcessedUrl || ''} alt={img.name} />
            </div>
            <div className="actions">
              <button
                type="button"
                className="action-btn btn-primary"
                onClick={() => {
                  if (postProcessedUrl && originalResultUrl) {
                    setPreviewCompare({
                      original: originalResultUrl,
                      result: postProcessedUrl,
                    });
                  }
                }}
                title="对比预览"
              >
                👁
              </button>
              <button
                type="button"
                className="action-btn btn-success"
                onClick={() => {
                  if (postProcessedUrl) {
                    const a = document.createElement('a');
                    const baseName = img.name.replace(/\.[^/.]+$/, '');
                    a.download = `${baseName}_processed.png`;
                    a.href = postProcessedUrl;
                    a.click();
                  }
                }}
                title="下载"
              >
                💾
              </button>
            </div>
            <div className="info">
              <div className="filename" title={img.name}>
                {img.name}
              </div>
              <div className="dimensions">后处理完成</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
