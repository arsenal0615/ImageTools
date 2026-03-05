import { useApp } from '../context/AppContext';

export default function PreviewModal() {
  const { state, setPreviewCompare } = useApp();
  const { previewCompare } = state;

  if (!previewCompare) return null;

  const close = () => setPreviewCompare(null);

  return (
    <div
      className="modal active"
      onClick={(e) => e.target === e.currentTarget && close()}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-content">
        <button type="button" className="modal-close" onClick={close} aria-label="关闭">
          ×
        </button>
        <div className="compare-view">
          <div className="compare-item">
            <img src={previewCompare.original} alt="原图" />
            <p>原图</p>
          </div>
          <div className="compare-item">
            <img src={previewCompare.result} alt="抠图结果" />
            <p>抠图结果</p>
          </div>
        </div>
      </div>
    </div>
  );
}
