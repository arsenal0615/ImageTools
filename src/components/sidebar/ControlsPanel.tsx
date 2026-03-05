import { useApp } from '../../context/AppContext';

interface ControlsPanelProps {
  onStart: () => void;
}

export default function ControlsPanel({ onStart }: ControlsPanelProps) {
  const { state, togglePause, cancelProcessing, clearAll, showToast } = useApp();
  const { processing, paused } = state;

  const handleClear = () => {
    clearAll();
    showToast('已清空所有图片', 'info');
  };

  const handleCancel = () => {
    cancelProcessing();
    showToast('已取消处理', 'warning');
  };

  return (
    <div className="panel">
      <div className="panel-title">操作控制</div>
      <div className="btn-group">
        <button type="button" className="btn btn-primary" onClick={onStart} disabled={processing}>
          ▶ 开始处理
        </button>
        <button
          type="button"
          className="btn btn-warning"
          onClick={togglePause}
          disabled={!processing}
        >
          {paused ? '▶ 继续' : '⏸ 暂停'}
        </button>
      </div>
      <div className="btn-group" style={{ marginTop: 10 }}>
        <button
          type="button"
          className="btn btn-danger"
          onClick={handleCancel}
          disabled={!processing}
        >
          ✕ 取消
        </button>
        <button type="button" className="btn btn-secondary" onClick={handleClear}>
          🗑 清空全部
        </button>
      </div>
    </div>
  );
}
