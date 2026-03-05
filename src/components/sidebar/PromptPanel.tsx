import { useApp } from '../../context/AppContext';
import { savePrompt } from '../../utils/storage';

export default function PromptPanel() {
  const { state, setSetting, showToast, resetPromptToDefault } = useApp();
  const { prompt } = state.settings;

  const handleSave = () => {
    setSetting('prompt', prompt);
    savePrompt(prompt);
    showToast('提示词已保存', 'success');
  };

  return (
    <div className="panel">
      <div className="panel-title">提示词设置</div>
      <div className="form-group">
        <label>
          抠图提示词{' '}
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>(可自行修改)</span>
        </label>
        <textarea value={prompt} onChange={(e) => setSetting('prompt', e.target.value)} rows={14} />
      </div>
      <div className="btn-group">
        <button type="button" className="btn btn-secondary" onClick={resetPromptToDefault} style={{ flex: 1 }}>
          ↻ 恢复默认
        </button>
        <button type="button" className="btn btn-secondary" onClick={handleSave} style={{ flex: 1 }}>
          💾 保存
        </button>
      </div>
    </div>
  );
}
