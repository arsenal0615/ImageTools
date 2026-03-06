import { useApp } from '../../context/AppContext';

export default function DownloadPanel() {
  const { state, downloadAll, downloadPostProcessed, showToast } = useApp();
  const hasResults = state.results.size > 0;
  const hasPostProcessed = state.postProcessedResults.size > 0;

  const handleDownloadAI = async () => {
    if (!hasResults) {
      showToast('没有可下载的 AI 处理结果', 'warning');
      return;
    }
    showToast('正在打包 AI 处理结果...', 'info');
    await downloadAll();
    showToast('下载完成！', 'success');
  };

  const handleDownloadPostProcessed = async () => {
    if (!hasPostProcessed) {
      showToast('没有可下载的后处理结果', 'warning');
      return;
    }
    showToast('正在打包后处理结果...', 'info');
    await downloadPostProcessed();
    showToast('下载完成！', 'success');
  };

  return (
    <div className="panel">
      <div className="panel-title">下载</div>
      <div className="download-buttons">
        <button
          type="button"
          className="btn btn-success"
          disabled={!hasResults}
          onClick={handleDownloadAI}
          title="下载 AI 生成的绿幕/抠图结果"
        >
          AI 处理结果
          <span className="badge">{state.results.size}</span>
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!hasPostProcessed}
          onClick={handleDownloadPostProcessed}
          title="下载经过绿幕抠图后处理的结果"
        >
          后处理结果
          <span className="badge">{state.postProcessedResults.size}</span>
        </button>
      </div>
      {!hasPostProcessed && hasResults && (
        <p className="download-hint">
          💡 前往"后处理"标签页处理绿幕图片
        </p>
      )}
    </div>
  );
}
