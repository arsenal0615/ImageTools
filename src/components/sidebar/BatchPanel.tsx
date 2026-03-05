import { useApp } from '../../context/AppContext';

export default function BatchPanel() {
  const { state, setSetting } = useApp();
  const { concurrency } = state.settings;

  return (
    <div className="panel">
      <div className="panel-title">批量处理</div>
      <div className="form-group">
        <label>并发数量 (1-5)</label>
        <input
          type="number"
          value={concurrency}
          onChange={(e) => setSetting('concurrency', parseInt(e.target.value, 10) || 1)}
          min={1}
          max={5}
        />
      </div>
    </div>
  );
}
