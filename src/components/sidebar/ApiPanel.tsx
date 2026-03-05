import { useApp } from '../../context/AppContext';
import { MODEL_OPTIONS } from '../../constants';

export default function ApiPanel() {
  const { state, setSetting } = useApp();
  const { apiKey, model } = state.settings;

  return (
    <div className="panel">
      <div className="panel-title">API 配置</div>
      <div className="form-group">
        <label>Gemini API Key</label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setSetting('apiKey', e.target.value)}
          placeholder="输入你的 API Key"
        />
      </div>
      <div className="form-group">
        <label>模型选择</label>
        <select value={model} onChange={(e) => setSetting('model', e.target.value)}>
          {MODEL_OPTIONS.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
    </div>
  );
}
