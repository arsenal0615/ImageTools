import type { ImageItem } from '../types';

interface ImageCardProps {
  type: 'source' | 'result';
  image: ImageItem;
  result?: string | null;
  statusText?: string;
  onRemove?: () => void;
  onRetry?: () => void;
  onPreview?: () => void;
  onDownload?: () => void;
  onCheckTransparency?: () => void;
}

export default function ImageCard({
  type,
  image,
  result,
  statusText,
  onRemove,
  onRetry,
  onPreview,
  onDownload,
  onCheckTransparency,
}: ImageCardProps) {
  const isSource = type === 'source';
  const isProcessing = image.status === 'processing';

  return (
    <div className={`image-card ${isProcessing ? 'is-processing' : ''}`}>
      <div
        className="thumb-container"
        style={
          result && !isSource
            ? { background: 'repeating-conic-gradient(#333 0% 25%, #444 0% 50%) 50% / 20px 20px' }
            : undefined
        }
      >
        <img src={isSource ? image.data : result ?? ''} alt={image.name} />
        {isProcessing && (
          <div className="processing-overlay">
            <div className="spinner" />
          </div>
        )}
      </div>
      {isSource && statusText != null && (
        <span className={`status status-${image.status}`}>{statusText}</span>
      )}
      {!isSource && isProcessing && (
        <span className="status status-processing">处理中...</span>
      )}
      <div className="actions">
        {onRemove && (
          <button type="button" className="action-btn btn-danger" onClick={onRemove} title="删除">
            🗑
          </button>
        )}
        {isSource && image.status === 'error' && onRetry && (
          <button type="button" className="action-btn btn-warning" onClick={onRetry} title="重试">
            🔄
          </button>
        )}
        {!isSource && !isProcessing && (
          <>
            {onPreview && (
              <button
                type="button"
                className="action-btn btn-primary"
                onClick={onPreview}
                title="对比预览"
              >
                👁
              </button>
            )}
            {onRetry && (
              <button
                type="button"
                className="action-btn btn-warning"
                onClick={onRetry}
                title="重新处理"
              >
                🔄
              </button>
            )}
            {onDownload && (
              <button
                type="button"
                className="action-btn btn-success"
                onClick={onDownload}
                title="下载"
              >
                💾
              </button>
            )}
            {onCheckTransparency && (
              <button
                type="button"
                className="action-btn btn-secondary"
                onClick={onCheckTransparency}
                title="检查透明度"
              >
                🔍
              </button>
            )}
          </>
        )}
      </div>
      <div className="info">
        <div className="filename" title={image.name}>
          {image.name}
        </div>
        <div className="dimensions">
          {isSource 
            ? `${image.width} × ${image.height}` 
            : isProcessing 
              ? '重新处理中...' 
              : '抠图完成'}
        </div>
      </div>
    </div>
  );
}
