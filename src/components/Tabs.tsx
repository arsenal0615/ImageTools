import { useApp } from '../context/AppContext';
import SourceGrid from './SourceGrid';
import ResultGrid from './ResultGrid';
import PostProcessPanel from './PostProcessPanel';
import PostProcessGrid from './PostProcessGrid';
import SequencePlayer from './SequencePlayer';
import type { AppState } from '../types';

const TABS: { id: AppState['activeTab']; label: string }[] = [
  { id: 'source', label: '原始图片' },
  { id: 'result', label: '处理结果' },
  { id: 'postprocess', label: '后处理' },
  { id: 'sequence', label: '序列帧预览' },
];

export default function Tabs() {
  const { state, setActiveTab } = useApp();
  const { activeTab } = state;

  return (
    <>
      <div className="tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'source' && (
        <div className="tab-content active">
          <div className="section-header">
            <h2>原始图片</h2>
            <span className="image-count">{state.images.length} 张图片</span>
          </div>
          <SourceGrid />
        </div>
      )}

      {activeTab === 'result' && (
        <div className="tab-content active">
          <div className="section-header">
            <h2>处理结果</h2>
            <span className="image-count">{state.results.size} 张完成</span>
          </div>
          <ResultGrid />
        </div>
      )}

      {activeTab === 'postprocess' && (
        <div className="tab-content active">
          <div className="postprocess-layout">
            <PostProcessPanel />
            <div className="postprocess-results">
              <div className="section-header">
                <h2>后处理结果</h2>
                <span className="image-count">{state.postProcessedResults.size} 张完成</span>
              </div>
              <PostProcessGrid />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sequence' && (
        <div className="tab-content active">
          <SequencePlayer />
        </div>
      )}
    </>
  );
}
