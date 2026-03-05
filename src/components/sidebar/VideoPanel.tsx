import { useApp } from '../../context/AppContext';

export default function VideoPanel() {
  const { state, setSetting } = useApp();
  const { videoFps } = state.settings;

  return (
    <div className="panel">
      <div className="panel-title">视频解析设置</div>
      <div className="form-group">
        <label>提取帧率 (FPS: 1-30)</label>
        <input
          type="number"
          value={videoFps}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            setSetting('videoFps', isNaN(val) ? 10 : val);
          }}
          min={1}
          max={30}
        />
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          上传视频时，将按此帧率提取图片进行处理
        </p>
      </div>
    </div>
  );
}
