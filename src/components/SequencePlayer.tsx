import { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';

type SourceType = 'result' | 'postprocess';

export default function SequencePlayer() {
  const { state, setCurrentFrame, setSequencePlaying } = useApp();
  const { results, postProcessedResults, images, currentFrame, sequencePlaying } = state;
  const [sourceType, setSourceType] = useState<SourceType>('result');
  const [fps, setFps] = useState(5);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentFrameRef = useRef(currentFrame);
  currentFrameRef.current = currentFrame;

  // 根据选择的来源获取帧数组
  const sourceMap = sourceType === 'postprocess' ? postProcessedResults : results;
  const resultArray = images.map((img) => sourceMap.get(img.id)).filter((v): v is string => Boolean(v));
  const totalFrames = resultArray.length;

  // 检查是否有后处理结果
  const hasPostProcessed = postProcessedResults.size > 0;

  useEffect(() => {
    if (!sequencePlaying || totalFrames === 0) return;
    intervalRef.current = setInterval(() => {
      const next = (currentFrameRef.current + 1) % totalFrames;
      setCurrentFrame(next);
    }, 1000 / fps);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [sequencePlaying, totalFrames, setCurrentFrame, fps]);

  const togglePlay = () => setSequencePlaying(!sequencePlaying);
  const goPrev = () =>
    setCurrentFrame(totalFrames > 0 ? (currentFrame - 1 + totalFrames) % totalFrames : 0);
  const goNext = () => setCurrentFrame(totalFrames > 0 ? (currentFrame + 1) % totalFrames : 0);

  const frame = resultArray[currentFrame] ?? null;

  return (
    <div className="sequence-player">
      {/* 来源选择 */}
      <div className="sequence-source-selector">
        <label>
          <input
            type="radio"
            name="source"
            value="result"
            checked={sourceType === 'result'}
            onChange={() => setSourceType('result')}
          />
          <span>处理结果 ({results.size})</span>
        </label>
        <label className={!hasPostProcessed ? 'disabled' : ''}>
          <input
            type="radio"
            name="source"
            value="postprocess"
            checked={sourceType === 'postprocess'}
            onChange={() => setSourceType('postprocess')}
            disabled={!hasPostProcessed}
          />
          <span>后处理结果 ({postProcessedResults.size})</span>
        </label>
      </div>

      <div className="sequence-display">
        {frame ? (
          <img src={frame} alt={`Frame ${currentFrame + 1}`} />
        ) : (
          <p style={{ color: 'var(--text-secondary)' }}>
            {sourceType === 'postprocess' 
              ? '请先在"后处理"标签页中处理图片' 
              : '完成处理后可预览序列帧'}
          </p>
        )}
      </div>
      <div className="sequence-controls">
        <button type="button" className="btn btn-secondary" onClick={goPrev} disabled={totalFrames === 0}>
          ◀
        </button>
        <button type="button" className="btn btn-primary" onClick={togglePlay} disabled={totalFrames === 0}>
          {sequencePlaying ? '⏸ 暂停' : '▶ 播放'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={goNext} disabled={totalFrames === 0}>
          ▶
        </button>
      </div>
      <div className="sequence-settings">
        <div className="form-group">
          <label>
            当前帧: {totalFrames > 0 ? currentFrame + 1 : 0} / {totalFrames}
          </label>
          <input
            type="range"
            min={0}
            max={Math.max(0, totalFrames - 1)}
            value={currentFrame}
            onChange={(e) => setCurrentFrame(parseInt(e.target.value, 10))}
            disabled={totalFrames === 0}
          />
        </div>
        <div className="form-group">
          <label>
            播放速度: {fps} FPS
          </label>
          <input
            type="range"
            min={1}
            max={30}
            value={fps}
            onChange={(e) => setFps(parseInt(e.target.value, 10))}
          />
        </div>
      </div>
    </div>
  );
}
