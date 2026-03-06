import ApiPanel from './sidebar/ApiPanel';
import PromptPanel from './sidebar/PromptPanel';
import SmartColorPanel from './sidebar/SmartColorPanel';
import BatchPanel from './sidebar/BatchPanel';
import OutputPanel from './sidebar/OutputPanel';
import ControlsPanel from './sidebar/ControlsPanel';
import DownloadPanel from './sidebar/DownloadPanel';
import VideoPanel from './sidebar/VideoPanel';

interface SidebarProps {
  onStart: () => void;
}

export default function Sidebar({ onStart }: SidebarProps) {
  return (
    <aside className="sidebar">
      <h1>🎨 AI IMAGES</h1>
      <ApiPanel />
      <SmartColorPanel />
      <PromptPanel />
      <BatchPanel />
      <VideoPanel />
      <OutputPanel />
      <ControlsPanel onStart={onStart} />
      <DownloadPanel />
    </aside>
  );
}
