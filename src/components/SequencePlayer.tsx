import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

export default function SequencePlayer() {
  const { state, setCurrentFrame, setSequencePlaying } = useApp();
  const { results, images, currentFrame, sequencePlaying } = state;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentFrameRef = useRef(currentFrame);
  currentFrameRef.current = currentFrame;
  const resultArray = images.map((img) => results.get(img.id)).filter((v): v is string => Boolean(v));
  const totalFrames = resultArray.length;
  const currentFps = 5;

  useEffect(() => {
    if (!sequencePlaying || totalFrames === 0) return;
    intervalRef.current = setInterval(() => {
      const next = (currentFrameRef.current + 1) % totalFrames;
      setCurrentFrame(next);
    }, 1000 / currentFps);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [sequencePlaying, totalFrames, setCurrentFrame]);

  const togglePlay = () => setSequencePlaying(!sequencePlaying);
  const goPrev = () =>
    setCurrentFrame(totalFrames > 0 ? (currentFrame - 1 + totalFrames) % totalFrames : 0);
  const goNext = () => setCurrentFrame(totalFrames > 0 ? (currentFrame + 1) % totalFrames : 0);

  const frame = resultArray[currentFrame] ?? null;

  return (
    <div className="sequence-player">
      <div className="sequence-display">
        {frame ? (
          <img src={frame} alt={`Frame ${currentFrame + 1}`} />
        ) : (
          <p style={{ color: 'var(--text-secondary)' }}>完成处理后可预览序列帧</p>
        )}
      </div>
      <div className="sequence-controls">
        <button type="button" className="btn btn-secondary" onClick={goPrev}>
          ◀
        </button>
        <button type="button" className="btn btn-primary" onClick={togglePlay}>
          {sequencePlaying ? '⏸ 暂停' : '▶ 播放'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={goNext}>
          ▶
        </button>
      </div>
      <div className="form-group" style={{ maxWidth: 300, margin: '0 auto' }}>
        <label>
          当前帧: {currentFrame + 1} / {totalFrames || 0}
        </label>
        <input
          type="range"
          min={0}
          max={Math.max(0, totalFrames - 1)}
          value={currentFrame}
          onChange={(e) => setCurrentFrame(parseInt(e.target.value, 10))}
        />
      </div>
    </div>
  );
}
