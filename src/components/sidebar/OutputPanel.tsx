import { useApp } from '../../context/AppContext';

export default function OutputPanel() {
  const { state, setSetting } = useApp();
  const {
    outputFormat,
    sizeMode,
    customWidth,
    customHeight,
    lockRatio,
    scalePercent,
  } = state.settings;

  const showCustom = sizeMode === 'custom';
  const showScale = sizeMode === 'scale';

  return (
    <div className="panel">
      <div className="panel-title">输出设置</div>
      <div className="form-group">
        <label>输出格式</label>
        <select
          value={outputFormat}
          onChange={(e) => setSetting('outputFormat', e.target.value as 'png' | 'webp')}
        >
          <option value="png">PNG (透明背景)</option>
          <option value="webp">WebP</option>
        </select>
      </div>
      <div className="form-group">
        <label>尺寸调整</label>
        <select
          value={sizeMode}
          onChange={(e) =>
            setSetting('sizeMode', e.target.value as 'original' | 'custom' | 'scale')
          }
        >
          <option value="original">保持原尺寸</option>
          <option value="custom">自定义宽高</option>
          <option value="scale">按比例缩放</option>
        </select>
      </div>
      {showCustom && (
        <>
          <div className="form-group size-custom">
            <div className="size-inputs">
              <input
                type="number"
                value={customWidth}
                onChange={(e) => setSetting('customWidth', e.target.value)}
                placeholder="宽度"
              />
              <span>×</span>
              <input
                type="number"
                value={customHeight}
                onChange={(e) => setSetting('customHeight', e.target.value)}
                placeholder="高度"
              />
            </div>
            <div className="checkbox-group" style={{ marginTop: 8 }}>
              <input
                type="checkbox"
                id="lockRatio"
                checked={lockRatio}
                onChange={(e) => setSetting('lockRatio', e.target.checked)}
              />
              <label htmlFor="lockRatio">锁定比例</label>
            </div>
          </div>
        </>
      )}
      {showScale && (
        <div className="form-group size-scale">
          <label>缩放比例 (%)</label>
          <input
            type="number"
            value={scalePercent}
            onChange={(e) => setSetting('scalePercent', parseInt(e.target.value, 10) || 100)}
            min={1}
            max={500}
          />
        </div>
      )}
    </div>
  );
}
