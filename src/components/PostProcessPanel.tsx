import { useApp } from '../context/AppContext';

export default function PostProcessPanel() {
  const { state, setGreenScreenSettings, applyPostProcessing, downloadPostProcessed } = useApp();
  const { greenScreenSettings, postProcessing, postProcessProgress, results, postProcessedResults, smartColor } = state;

  const handleSettingChange = (key: string, value: number | string | boolean) => {
    setGreenScreenSettings({ [key]: value });
  };

  const hasResults = results.size > 0;
  const hasPostProcessed = postProcessedResults.size > 0;

  return (
    <div className="post-process-panel">
      <div className="section-header">
        <h2>🎬 绿幕后处理</h2>
        <span className="image-count">
          {hasPostProcessed ? `${postProcessedResults.size} 张已处理` : `${results.size} 张待处理`}
        </span>
      </div>

      <div className="post-process-settings">
        {/* 启用开关 */}
        <div className="setting-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={greenScreenSettings.enabled}
              onChange={(e) => handleSettingChange('enabled', e.target.checked)}
            />
            <span>启用绿幕抠图</span>
          </label>
        </div>

        {greenScreenSettings.enabled && (
          <>
            {/* 键控颜色 */}
            <div className="setting-group">
              <label>
                键控颜色
                {smartColor.enabled && smartColor.recommendation && (
                  <span className="smart-color-badge" title="使用 AI 推荐的颜色">
                    🤖 AI
                  </span>
                )}
              </label>
              <div className="color-input-group">
                <input
                  type="color"
                  value={greenScreenSettings.keyColor}
                  onChange={(e) => handleSettingChange('keyColor', e.target.value)}
                />
                <input
                  type="text"
                  value={greenScreenSettings.keyColor}
                  onChange={(e) => handleSettingChange('keyColor', e.target.value)}
                  placeholder="#00FF00"
                />
              </div>
              <div className="preset-colors">
                <button
                  type="button"
                  className="color-preset green"
                  onClick={() => handleSettingChange('keyColor', '#00FF00')}
                  title="标准绿幕"
                />
                <button
                  type="button"
                  className="color-preset blue"
                  onClick={() => handleSettingChange('keyColor', '#0000FF')}
                  title="蓝幕"
                />
                <button
                  type="button"
                  className="color-preset magenta"
                  onClick={() => handleSettingChange('keyColor', '#FF00FF')}
                  title="品红"
                />
              </div>
              {smartColor.enabled && smartColor.recommendation && (
                <p className="setting-hint">
                  💡 当前使用 AI 推荐: {smartColor.recommendation.colorName}
                </p>
              )}
            </div>

            {/* 相似度 */}
            <div className="setting-group">
              <label>
                颜色相似度
                <span className="value-display">{(greenScreenSettings.similarity * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={greenScreenSettings.similarity * 100}
                onChange={(e) => handleSettingChange('similarity', Number(e.target.value) / 100)}
              />
              <p className="setting-hint">越高则抠除的颜色范围越大</p>
            </div>

            {/* 平滑度 */}
            <div className="setting-group">
              <label>
                边缘平滑度
                <span className="value-display">{(greenScreenSettings.smoothness * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="50"
                value={greenScreenSettings.smoothness * 100}
                onChange={(e) => handleSettingChange('smoothness', Number(e.target.value) / 100)}
              />
              <p className="setting-hint">控制透明到不透明的过渡区域</p>
            </div>

            {/* 边缘羽化 */}
            <div className="setting-group">
              <label>
                边缘羽化
                <span className="value-display">{greenScreenSettings.featherRadius.toFixed(1)}px</span>
              </label>
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={greenScreenSettings.featherRadius}
                onChange={(e) => handleSettingChange('featherRadius', Number(e.target.value))}
              />
              <p className="setting-hint">模糊边缘使过渡更自然</p>
            </div>

            {/* 边缘收缩/扩展 */}
            <div className="setting-group">
              <label>
                边缘调整
                <span className="value-display">{greenScreenSettings.edgeShift > 0 ? '+' : ''}{greenScreenSettings.edgeShift}px</span>
              </label>
              <input
                type="range"
                min="-5"
                max="5"
                step="1"
                value={greenScreenSettings.edgeShift}
                onChange={(e) => handleSettingChange('edgeShift', Number(e.target.value))}
              />
              <p className="setting-hint">负值收缩边缘，正值扩展边缘</p>
            </div>

            {/* 溢色抑制 */}
            <div className="setting-group">
              <label>
                溢色抑制
                <span className="value-display">{(greenScreenSettings.spillSuppression * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={greenScreenSettings.spillSuppression * 100}
                onChange={(e) => handleSettingChange('spillSuppression', Number(e.target.value) / 100)}
              />
              <p className="setting-hint">去除主体边缘的绿色反光</p>
            </div>
          </>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="post-process-actions">
        {postProcessing ? (
          <div className="processing-status">
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${postProcessProgress}%` }} />
            </div>
            <span>处理中... {postProcessProgress}%</span>
          </div>
        ) : (
          <>
            <button
              type="button"
              className="btn btn-primary"
              onClick={applyPostProcessing}
              disabled={!hasResults || !greenScreenSettings.enabled}
            >
              🎨 应用后处理
            </button>
            {hasPostProcessed && (
              <button
                type="button"
                className="btn btn-success"
                onClick={downloadPostProcessed}
              >
                📦 下载处理结果
              </button>
            )}
          </>
        )}
      </div>

      {!hasResults && (
        <div className="empty-hint">
          <p>💡 请先在"处理结果"中生成图片，然后再进行后处理</p>
        </div>
      )}
    </div>
  );
}
