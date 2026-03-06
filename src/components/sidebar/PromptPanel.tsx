import { useApp } from '../../context/AppContext';
import { savePrompt } from '../../utils/storage';
import { PROMPT_PRESETS, DEFAULT_PROMPT, TRANSPARENT_PROMPT } from '../../constants';

export default function PromptPanel() {
  const { state, setSetting, showToast, resetPromptToDefault } = useApp();
  const { prompt } = state.settings;

  const handleSave = () => {
    setSetting('prompt', prompt);
    savePrompt(prompt);
    showToast('提示词已保存', 'success');
  };

  const handlePresetChange = (presetId: string) => {
    const preset = PROMPT_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setSetting('prompt', preset.prompt);
      showToast(`已切换到${preset.label}`, 'info');
    }
  };

  // 检测当前使用的是哪个预设
  const currentPreset = prompt === DEFAULT_PROMPT 
    ? 'greenscreen' 
    : prompt === TRANSPARENT_PROMPT 
      ? 'transparent' 
      : 'custom';

  return (
    <div className="panel">
      <div className="panel-title">提示词设置</div>
      
      {/* 预设选择 */}
      <div className="form-group">
        <label>模式选择</label>
        <div className="preset-selector">
          {PROMPT_PRESETS.map((preset) => (
            <label key={preset.id} className={`preset-option ${currentPreset === preset.id ? 'active' : ''}`}>
              <input
                type="radio"
                name="prompt-preset"
                value={preset.id}
                checked={currentPreset === preset.id}
                onChange={() => handlePresetChange(preset.id)}
              />
              <span>{preset.label}</span>
            </label>
          ))}
        </div>
        <p className="preset-hint">
          {currentPreset === 'greenscreen' && '💡 绿幕模式：AI 生成绿色背景，后处理转为透明'}
          {currentPreset === 'transparent' && '💡 透明模式：直接让 AI 生成透明背景（效果可能不稳定）'}
          {currentPreset === 'custom' && '💡 自定义模式：使用您修改的提示词'}
        </p>
      </div>

      <div className="form-group">
        <label>
          抠图提示词{' '}
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>(可自行修改)</span>
        </label>
        <textarea value={prompt} onChange={(e) => setSetting('prompt', e.target.value)} rows={10} />
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
