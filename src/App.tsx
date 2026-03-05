import { useEffect, useRef } from 'react';
import { useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import UploadZone from './components/UploadZone';
import ProgressSection from './components/ProgressSection';
import Tabs from './components/Tabs';
import PreviewModal from './components/PreviewModal';
import ToastContainer from './components/ToastContainer';

export default function App() {
  const { loadSettingsOnMount, state, startProcessing, showToast } = useApp();
  const prevProcessing = useRef(false);

  useEffect(() => {
    loadSettingsOnMount();
  }, [loadSettingsOnMount]);

  useEffect(() => {
    if (prevProcessing.current && !state.processing && (state.completed > 0 || state.failed > 0)) {
      showToast(
        `处理完成！成功 ${state.completed} 张，失败 ${state.failed} 张`,
        state.failed === 0 ? 'success' : 'warning'
      );
    }
    prevProcessing.current = state.processing;
  }, [state.processing, state.completed, state.failed, showToast]);

  const handleStart = async () => {
    const result = await startProcessing();
    if (result?.error) showToast(result.error, 'error');
  };

  return (
    <div className="app-container">
      <Sidebar onStart={handleStart} />
      <main className="main-content">
        <UploadZone />
        <ProgressSection />
        <Tabs />
      </main>
      <PreviewModal />
      <ToastContainer />
    </div>
  );
}
