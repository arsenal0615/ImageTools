import { useApp } from '../context/AppContext';
import SourceGrid from './SourceGrid';
import ResultGrid from './ResultGrid';
import SequencePlayer from './SequencePlayer';
import type { AppState } from '../types';

const TABS: { id: AppState['activeTab']; label: string }[] = [
  { id: 'source', label: '原始图片' },
  { id: 'result', label: '处理结果' },
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

      {activeTab === 'sequence' && (
        <div className="tab-content active">
          <SequencePlayer />
        </div>
      )}
    </>
  );
}
