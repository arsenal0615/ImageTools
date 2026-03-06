import { useState } from 'react';
import { useApp } from '../../context/AppContext';

export default function SmartColorPanel() {
  const { 
    state, 
    analyzeSmartColor, 
    applySmartColor, 
    clearSmartColor,
    setSmartColorPrompt,
    setSmartColorEnabled,
  } = useApp();
  
  const { smartColor, images } = state;
  const [expanded, setExpanded] = useState(false);
  const [showPromptEditor, setShowPromptEditor] = useState(false);

  const hasImages = images.length > 0;
  const hasRecommendation = smartColor.recommendation !== null;

  return (
    <div className="panel smart-color-panel">
      <div 
        className="panel-title clickable"
        onClick={() => setExpanded(!expanded)}
      >
        <span>🎨 AI 智能选色</span>
        <span className={`expand-icon ${expanded ? 'expanded' : ''}`}>▼</span>
      </div>

      {expanded && (
        <div className="smart-color-content">
          {/* 状态显示 */}
          {hasRecommendation && (
            <div className="recommendation-card">
              <div className="color-preview-row">
                <div 
                  className="color-swatch"
                  style={{ backgroundColor: smartColor.recommendation!.color }}
                />
                <div className="color-info">
                  <div className="color-name">{smartColor.recommendation!.colorName}</div>
                  <div className="color-hex">{smartColor.recommendation!.color}</div>
                </div>
                <div className="confidence-badge">
                  {smartColor.recommendation!.confidence}%
                </div>
              </div>
              <p className="recommendation-reason">{smartColor.recommendation!.reason}</p>
              
              {/* 启用开关 */}
              <label className="enable-toggle">
                <input
                  type="checkbox"
                  checked={smartColor.enabled}
                  onChange={(e) => setSmartColorEnabled(e.target.checked)}
                />
                <span>使用此颜色</span>
              </label>
            </div>
          )}

          {/* 分析按钮 */}
          <div className="smart-color-actions">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={!hasImages || smartColor.analyzing}
              onClick={() => analyzeSmartColor()}
              title={!hasImages ? '请先上传图片' : '分析第一张图片的颜色'}
            >
              {smartColor.analyzing ? (
                <>
                  <span className="spinner-small" />
                  分析中...
                </>
              ) : (
                <>🔍 {hasRecommendation ? '重新分析' : '分析颜色'}</>
              )}
            </button>

            {hasRecommendation && !smartColor.enabled && (
              <button
                type="button"
                className="btn btn-success btn-sm"
                onClick={applySmartColor}
              >
                ✓ 应用
              </button>
            )}

            {hasRecommendation && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={clearSmartColor}
                title="清除推荐结果"
              >
                ✕
              </button>
            )}
          </div>

          {/* 分析说明 */}
          {smartColor.analysis && (
            <details className="analysis-details">
              <summary>分析详情</summary>
              <p>{smartColor.analysis}</p>
            </details>
          )}

          {/* 自定义提示词 */}
          <div className="prompt-editor-toggle">
            <button
              type="button"
              className="btn-link"
              onClick={() => setShowPromptEditor(!showPromptEditor)}
            >
              {showPromptEditor ? '收起' : '自定义分析提示词'} ▾
            </button>
          </div>

          {showPromptEditor && (
            <div className="prompt-editor">
              <textarea
                value={smartColor.customPrompt}
                onChange={(e) => setSmartColorPrompt(e.target.value)}
                rows={6}
                placeholder="输入自定义的颜色分析提示词..."
              />
              <p className="hint">修改后点击"分析颜色"使用新提示词</p>
            </div>
          )}

          {/* 使用提示 */}
          {!hasImages && (
            <p className="empty-hint">请先上传图片再进行颜色分析</p>
          )}
        </div>
      )}
    </div>
  );
}
