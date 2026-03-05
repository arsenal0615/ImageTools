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
  processing: boolean;
  paused: boolean;
  cancelled: boolean;
  completed: number;
  failed: number;
  sequencePlaying: boolean;
  sequenceInterval: ReturnType<typeof setInterval> | null;
  currentFrame: number;
  activeTab: 'source' | 'result' | 'sequence';
  previewCompare: PreviewCompare | null;
  toasts: ToastItem[];
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
