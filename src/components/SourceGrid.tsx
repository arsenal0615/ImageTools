import { useApp } from '../context/AppContext';
import ImageCard from './ImageCard';

const STATUS_TEXT: Record<string, string> = {
  pending: '等待中',
  processing: '处理中',
  success: '成功',
  error: '失败',
};

export default function SourceGrid() {
  const { state, removeImage, retryImage } = useApp();
  const { images } = state;

  if (images.length === 0) {
    return (
      <div className="empty-state">
        <div className="icon">🖼️</div>
        <p>还没有上传图片</p>
      </div>
    );
  }

  return (
    <div className="image-grid">
      {images.map((img) => (
        <ImageCard
          key={img.id}
          type="source"
          image={img}
          result={state.results.get(img.id)}
          statusText={STATUS_TEXT[img.status] ?? img.status}
          onRemove={() => removeImage(img.id)}
          onRetry={() => retryImage(img.id)}
        />
      ))}
    </div>
  );
}
