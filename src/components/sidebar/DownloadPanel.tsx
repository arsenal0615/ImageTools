import { useApp } from '../../context/AppContext';

export default function DownloadPanel() {
  const { state, downloadAll, showToast } = useApp();
  const hasResults = state.results.size > 0;

  const handleDownload = async () => {
    if (!hasResults) {
      showToast('没有可下载的图片', 'warning');
      return;
    }
    showToast('正在打包...', 'info');
    await downloadAll();
    showToast('下载完成！', 'success');
  };

  return (
    <div className="panel">
      <div className="panel-title">下载</div>
      <div className="btn-group">
        <button
          type="button"
          className="btn btn-success"
          disabled={!hasResults}
          onClick={handleDownload}
        >
          📦 打包下载
        </button>
      </div>
    </div>
  );
}
