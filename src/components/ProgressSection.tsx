import { useApp } from '../context/AppContext';

export default function ProgressSection() {
  const { state } = useApp();
  const { processing, completed, failed, images } = state;
  const total = images.length;
  const done = completed + failed;
  const percent = total > 0 ? (done / total) * 100 : 0;

  if (!processing && done === 0) return null;

  return (
    <div className="progress-section active">
      <div className="progress-header">
        <span>处理进度</span>
        <span>
          {done} / {total}
        </span>
      </div>
      <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
