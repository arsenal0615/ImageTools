export type ImageStatus = 'pending' | 'processing' | 'success' | 'error';

export interface ImageItem {
  id: string;
  file: File;
  name: string;
  data: string;
  width: number;
  height: number;
  status: ImageStatus;
}

export interface Settings {
  apiKey: string;
  model: string;
  prompt: string;
  concurrency: number;
  outputFormat: 'png' | 'webp';
  sizeMode: 'original' | 'custom' | 'scale';
  customWidth: string;
  customHeight: string;
  lockRatio: boolean;
  scalePercent: number;
  videoFps: number;
}

export interface ToastItem {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface PreviewCompare {
  original: string;
  result: string;
}

export interface AppState {
  settings: Settings;
  images: ImageItem[];
  results: Map<string, string>;
  /** 后处理结果 */
  postProcessedResults: Map<string, string>;
  processing: boolean;
  paused: boolean;
  cancelled: boolean;
  completed: number;
  failed: number;
  sequencePlaying: boolean;
  sequenceInterval: ReturnType<typeof setInterval> | null;
  currentFrame: number;
  activeTab: 'source' | 'result' | 'postprocess' | 'sequence';
  previewCompare: PreviewCompare | null;
  toasts: ToastItem[];
  /** 绿幕后处理设置 */
  greenScreenSettings: GreenScreenSettings;
  /** 后处理进度 */
  postProcessing: boolean;
  postProcessProgress: number;
  /** AI 智能选色状态 */
  smartColor: SmartColorState;
}

export interface OutputSettings {
  sizeMode: string;
  customWidth: string;
  customHeight: string;
  lockRatio: boolean;
  scalePercent: number;
  outputFormat: string;
}

export interface TransparencyResult {
  width: number;
  height: number;
  totalPixels: number;
  transparentPixels: number;
  semiTransparentPixels: number;
  opaquePixels: number;
  cornerAlphas: number[];
}

export interface GeminiAPIParams {
  apiKey: string;
  model: string;
  prompt: string;
  imageData: string;
  mimeType: string;
}

export interface GreenScreenSettings {
  /** 是否启用绿幕处理 */
  enabled: boolean;
  /** 目标颜色 (hex 格式，如 #00FF00) */
  keyColor: string;
  /** 颜色相似度阈值 (0-1)，越大容差越高 */
  similarity: number;
  /** 平滑度/溢出抑制 (0-1) */
  smoothness: number;
  /** 边缘羽化强度 (0-10) */
  featherRadius: number;
  /** 边缘收缩/扩展 (-10 到 10) */
  edgeShift: number;
  /** 溢色抑制强度 (0-1) */
  spillSuppression: number;
}

export interface ColorRecommendation {
  /** 推荐的背景色 (hex 格式) */
  color: string;
  /** 颜色名称 */
  colorName: string;
  /** 推荐理由 */
  reason: string;
  /** 置信度 (0-100) */
  confidence: number;
}

export interface SmartColorState {
  /** 是否启用 AI 推荐的颜色 */
  enabled: boolean;
  /** 是否正在分析 */
  analyzing: boolean;
  /** 推荐结果 */
  recommendation: ColorRecommendation | null;
  /** 分析说明 */
  analysis: string;
  /** 自定义分析提示词 */
  customPrompt: string;
  /** 用于分析的图片 ID */
  sourceImageId: string | null;
}
