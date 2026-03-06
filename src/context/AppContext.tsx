import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from 'react';
import { readFileAsDataURL, getImageDimensions, enforceOriginalDimensions, applyOutputSettings } from '../utils/image';
import { callGeminiAPI } from '../utils/gemini';
import { extractFramesFromVideo } from '../utils/video';
import { processGreenScreen, DEFAULT_GREEN_SCREEN_SETTINGS } from '../utils/greenScreen';
import { loadSettings, saveApiKey, saveModel, savePrompt, removePrompt } from '../utils/storage';
import { DEFAULT_PROMPT } from '../constants';
import JSZip from 'jszip';
import type { AppState, Settings, ImageItem, ToastItem, GreenScreenSettings, SmartColorState, ColorRecommendation } from '../types';
import { analyzeImageColors, generatePromptWithColor, DEFAULT_COLOR_ANALYSIS_PROMPT_TEXT } from '../utils/colorAnalysis';

type AppAction =
  | { type: 'LOAD_SETTINGS' }
  | { type: 'SET_SETTING'; key: keyof Settings; value: Settings[keyof Settings] }
  | { type: 'SET_IMAGES'; payload: ImageItem[] }
  | { type: 'ADD_IMAGE'; payload: ImageItem }
  | { type: 'REMOVE_IMAGE'; payload: string }
  | { type: 'SET_IMAGE_STATUS'; id: string; status: ImageItem['status'] }
  | { type: 'SET_RESULT'; id: string; dataUrl: string }
  | { type: 'DELETE_RESULT'; id: string }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_PAUSED'; payload: boolean }
  | { type: 'SET_CANCELLED'; payload: boolean }
  | { type: 'INC_COMPLETED' }
  | { type: 'INC_FAILED' }
  | { type: 'RESET_PROGRESS' }
  | { type: 'CLEAR_ALL' }
  | { type: 'SET_SEQUENCE_PLAYING'; payload: boolean }
  | { type: 'SET_CURRENT_FRAME'; payload: number }
  | { type: 'SET_ACTIVE_TAB'; payload: AppState['activeTab'] }
  | { type: 'SET_PREVIEW_COMPARE'; payload: AppState['previewCompare'] }
  | { type: 'ADD_TOAST'; id: string; message: string; toastType: ToastItem['type'] }
  | { type: 'REMOVE_TOAST'; id: string }
  | { type: 'SET_GREEN_SCREEN_SETTINGS'; payload: Partial<GreenScreenSettings> }
  | { type: 'SET_POST_PROCESSED_RESULT'; id: string; dataUrl: string }
  | { type: 'DELETE_POST_PROCESSED_RESULT'; id: string }
  | { type: 'CLEAR_POST_PROCESSED_RESULTS' }
  | { type: 'SET_POST_PROCESSING'; payload: boolean }
  | { type: 'SET_POST_PROCESS_PROGRESS'; payload: number }
  | { type: 'SET_SMART_COLOR'; payload: Partial<SmartColorState> }
  | { type: 'SET_SMART_COLOR_RECOMMENDATION'; payload: { recommendation: ColorRecommendation; analysis: string; sourceImageId: string } }
  | { type: 'CLEAR_SMART_COLOR' };

export interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  loadSettingsOnMount: () => void;
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  addFiles: (files: File[]) => Promise<void>;
  removeImage: (id: string) => void;
  startProcessing: () => Promise<{ error?: string }>;
  togglePause: () => void;
  cancelProcessing: () => void;
  clearAll: () => void;
  retryImage: (id: string) => Promise<void>;
  setActiveTab: (tab: AppState['activeTab']) => void;
  setPreviewCompare: (payload: AppState['previewCompare']) => void;
  setCurrentFrame: (frame: number) => void;
  setSequencePlaying: (playing: boolean) => void;
  showToast: (message: string, type?: ToastItem['type']) => void;
  resetPromptToDefault: () => void;
  downloadAll: () => Promise<void>;
  setGreenScreenSettings: (settings: Partial<GreenScreenSettings>) => void;
  applyPostProcessing: () => Promise<void>;
  downloadPostProcessed: () => Promise<void>;
  analyzeSmartColor: (imageId?: string) => Promise<void>;
  applySmartColor: () => void;
  clearSmartColor: () => void;
  setSmartColorPrompt: (prompt: string) => void;
  setSmartColorEnabled: (enabled: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const initialState: AppState = {
  settings: {
    apiKey: '',
    model: 'gemini-2.0-flash-exp-image-generation',
    prompt: DEFAULT_PROMPT,
    concurrency: 1,
    outputFormat: 'png',
    sizeMode: 'original',
    customWidth: '',
    customHeight: '',
    lockRatio: true,
    scalePercent: 100,
    videoFps: 10,
  },
  images: [],
  results: new Map(),
  postProcessedResults: new Map(),
  processing: false,
  paused: false,
  cancelled: false,
  completed: 0,
  failed: 0,
  sequencePlaying: false,
  sequenceInterval: null,
  currentFrame: 0,
  activeTab: 'source',
  previewCompare: null,
  toasts: [],
  greenScreenSettings: DEFAULT_GREEN_SCREEN_SETTINGS,
  postProcessing: false,
  postProcessProgress: 0,
  smartColor: {
    enabled: false,
    analyzing: false,
    recommendation: null,
    analysis: '',
    customPrompt: DEFAULT_COLOR_ANALYSIS_PROMPT_TEXT,
    sourceImageId: null,
  },
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'LOAD_SETTINGS': {
      const loaded = loadSettings();
      return {
        ...state,
        settings: {
          ...state.settings,
          apiKey: loaded.apiKey,
          model: loaded.model || state.settings.model,
          prompt: loaded.prompt ?? state.settings.prompt,
        },
      };
    }
    case 'SET_SETTING':
      return {
        ...state,
        settings: { ...state.settings, [action.key]: action.value },
      };
    case 'SET_IMAGES':
      return { ...state, images: action.payload };
    case 'ADD_IMAGE':
      return { ...state, images: [...state.images, action.payload] };
    case 'REMOVE_IMAGE': {
      const images = state.images.filter((img) => img.id !== action.payload);
      const results = new Map(state.results);
      results.delete(action.payload);
      return { ...state, images, results };
    }
    case 'SET_IMAGE_STATUS':
      return {
        ...state,
        images: state.images.map((img) =>
          img.id === action.id ? { ...img, status: action.status } : img
        ),
      };
    case 'SET_RESULT': {
      const results = new Map(state.results);
      results.set(action.id, action.dataUrl);
      return { ...state, results };
    }
    case 'DELETE_RESULT': {
      const results = new Map(state.results);
      results.delete(action.id);
      return { ...state, results };
    }
    case 'SET_PROCESSING':
      return { ...state, processing: action.payload };
    case 'SET_PAUSED':
      return { ...state, paused: action.payload };
    case 'SET_CANCELLED':
      return { ...state, cancelled: action.payload };
    case 'INC_COMPLETED':
      return { ...state, completed: state.completed + 1 };
    case 'INC_FAILED':
      return { ...state, failed: state.failed + 1 };
    case 'RESET_PROGRESS':
      return {
        ...state,
        completed: 0,
        failed: 0,
        processing: false,
        paused: false,
        cancelled: false,
      };
    case 'CLEAR_ALL':
      return {
        ...state,
        images: [],
        results: new Map(),
        postProcessedResults: new Map(),
        completed: 0,
        failed: 0,
        currentFrame: 0,
        previewCompare: null,
        postProcessProgress: 0,
      };
    case 'SET_SEQUENCE_PLAYING':
      return { ...state, sequencePlaying: action.payload };
    case 'SET_CURRENT_FRAME':
      return { ...state, currentFrame: action.payload };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'SET_PREVIEW_COMPARE':
      return { ...state, previewCompare: action.payload };
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [...state.toasts, { id: action.id, message: action.message, type: action.toastType }],
      };
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) };
    case 'SET_GREEN_SCREEN_SETTINGS':
      return {
        ...state,
        greenScreenSettings: { ...state.greenScreenSettings, ...action.payload },
      };
    case 'SET_POST_PROCESSED_RESULT': {
      const postProcessedResults = new Map(state.postProcessedResults);
      postProcessedResults.set(action.id, action.dataUrl);
      return { ...state, postProcessedResults };
    }
    case 'DELETE_POST_PROCESSED_RESULT': {
      const postProcessedResults = new Map(state.postProcessedResults);
      postProcessedResults.delete(action.id);
      return { ...state, postProcessedResults };
    }
    case 'CLEAR_POST_PROCESSED_RESULTS':
      return { ...state, postProcessedResults: new Map(), postProcessProgress: 0 };
    case 'SET_POST_PROCESSING':
      return { ...state, postProcessing: action.payload };
    case 'SET_POST_PROCESS_PROGRESS':
      return { ...state, postProcessProgress: action.payload };
    case 'SET_SMART_COLOR':
      return { ...state, smartColor: { ...state.smartColor, ...action.payload } };
    case 'SET_SMART_COLOR_RECOMMENDATION':
      return {
        ...state,
        smartColor: {
          ...state.smartColor,
          recommendation: action.payload.recommendation,
          analysis: action.payload.analysis,
          sourceImageId: action.payload.sourceImageId,
          analyzing: false,
        },
      };
    case 'CLEAR_SMART_COLOR':
      return {
        ...state,
        smartColor: {
          ...state.smartColor,
          enabled: false,
          recommendation: null,
          analysis: '',
          sourceImageId: null,
        },
      };
    default:
      return state;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const cancelledRef = useRef(false);
  const pausedRef = useRef(false);
  useEffect(() => {
    cancelledRef.current = state.cancelled;
    pausedRef.current = state.paused;
  }, [state.cancelled, state.paused]);

  const loadSettingsOnMount = useCallback(() => {
    dispatch({ type: 'LOAD_SETTINGS' });
  }, []);

  const setSetting = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    dispatch({ type: 'SET_SETTING', key, value });
    if (key === 'apiKey') saveApiKey(value as string);
    if (key === 'model') saveModel(value as string);
    if (key === 'prompt') savePrompt(value as string);
  }, []);

  const showToast = useCallback((message: string, type: ToastItem['type'] = 'info') => {
    const id = Date.now() + Math.random().toString(36).slice(2, 9);
    dispatch({ type: 'ADD_TOAST', id, message, toastType: type });
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', id }), 3000);
  }, []);

  const addFiles = useCallback(async (files: File[]) => {
    for (const file of files) {
      if (file.type.startsWith('video/')) {
        showToast('正在解析视频，请稍候...', 'info');
        try {
          const frames = await extractFramesFromVideo(file, state.settings.videoFps);
          showToast(`视频解析完成，共提取 ${frames.length} 帧`, 'success');
          for (const frame of frames) {
            const id = Date.now() + Math.random().toString(36).slice(2, 11);
            const data = await readFileAsDataURL(frame);
            const { width, height } = await getImageDimensions(data);
            dispatch({
              type: 'ADD_IMAGE',
              payload: { id, file: frame, name: frame.name, data, width, height, status: 'pending' },
            });
          }
        } catch (err) {
          showToast('视频解析失败', 'error');
        }
        continue;
      }

      if (!file.type.startsWith('image/')) continue;
      const id = Date.now() + Math.random().toString(36).slice(2, 11);
      const data = await readFileAsDataURL(file);
      const { width, height } = await getImageDimensions(data);
      dispatch({
        type: 'ADD_IMAGE',
        payload: { id, file, name: file.name, data, width, height, status: 'pending' },
      });
    }
  }, [state.settings.videoFps, showToast]);

  const removeImage = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_IMAGE', payload: id });
  }, []);

  const startProcessing = useCallback(async (): Promise<{ error?: string }> => {
    const { apiKey, model, prompt, concurrency } = state.settings;
    if (!apiKey?.trim()) return { error: '请输入 API Key' };
    if (state.images.length === 0) return { error: '请先上传图片' };

    cancelledRef.current = false;
    pausedRef.current = false;
    
    // 只在首次开始时重置进度（没有任何处理中/已完成/失败的图片时）
    const hasAnyProcessed = state.images.some(
      (img) => img.status === 'success' || img.status === 'error'
    );
    if (!hasAnyProcessed) {
      dispatch({ type: 'RESET_PROGRESS' });
    }
    
    dispatch({ type: 'SET_PROCESSING', payload: true });

    const pending = state.images.filter((img) => img.status === 'pending' || img.status === 'error');
    const queue = [...pending];
    const processOne = async (): Promise<void> => {
      while (queue.length > 0 && !cancelledRef.current) {
        if (pausedRef.current) {
          await new Promise((r) => setTimeout(r, 100));
          continue;
        }
        const img = queue.shift();
        if (!img) continue;
        try {
          dispatch({ type: 'SET_IMAGE_STATUS', id: img.id, status: 'processing' });
          const result = await callGeminiAPI({
            apiKey: apiKey.trim(),
            model,
            prompt: (prompt || DEFAULT_PROMPT).trim(),
            imageData: img.data,
            mimeType: img.file.type,
          });
          const enforced = await enforceOriginalDimensions(result, img.width, img.height);
          const processed = await applyOutputSettings(enforced, img, state.settings);
          dispatch({ type: 'SET_RESULT', id: img.id, dataUrl: processed });
          dispatch({ type: 'SET_IMAGE_STATUS', id: img.id, status: 'success' });
          dispatch({ type: 'INC_COMPLETED' });
        } catch (err) {
          dispatch({ type: 'SET_IMAGE_STATUS', id: img.id, status: 'error' });
          dispatch({ type: 'INC_FAILED' });
          // 继续处理下一张，不要停止整个流程
          console.error(`图片 ${img.name} 处理失败:`, err);
          continue;
        }
      }
    };
    const workers: Promise<void>[] = [];
    for (let i = 0; i < Math.min(concurrency || 1, queue.length); i++) {
      workers.push(processOne());
    }
    await Promise.all(workers);

    dispatch({ type: 'SET_PROCESSING', payload: false });
    return {};
  }, [state.settings, state.images]);

  const togglePause = useCallback(() => {
    dispatch({ type: 'SET_PAUSED', payload: !state.paused });
  }, [state.paused]);

  const cancelProcessing = useCallback(() => {
    dispatch({ type: 'SET_CANCELLED', payload: true });
    dispatch({ type: 'SET_PROCESSING', payload: false });
  }, []);

  const clearAll = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' });
  }, []);

  const retryImage = useCallback(
    async (id: string) => {
      const img = state.images.find((i) => i.id === id);
      if (!img || img.status === 'processing') return;
      
      // 清除旧的结果和后处理结果
      if (state.results.has(id)) dispatch({ type: 'DELETE_RESULT', id });
      if (state.postProcessedResults.has(id)) dispatch({ type: 'DELETE_POST_PROCESSED_RESULT', id });
      
      dispatch({ type: 'SET_IMAGE_STATUS', id, status: 'pending' });
      const { apiKey, model, prompt } = state.settings;
      if (!apiKey?.trim()) {
        showToast('请先设置 API Key', 'error');
        return;
      }
      
      showToast(`正在重新处理: ${img.name}`, 'info');
      
      try {
        dispatch({ type: 'SET_IMAGE_STATUS', id, status: 'processing' });
        const result = await callGeminiAPI({
          apiKey: apiKey.trim(),
          model,
          prompt: (prompt || DEFAULT_PROMPT).trim(),
          imageData: img.data,
          mimeType: img.file.type,
        });
        const enforced = await enforceOriginalDimensions(result, img.width, img.height);
        const processed = await applyOutputSettings(enforced, img, state.settings);
        dispatch({ type: 'SET_RESULT', id, dataUrl: processed });
        dispatch({ type: 'SET_IMAGE_STATUS', id, status: 'success' });
        dispatch({ type: 'INC_COMPLETED' });
        showToast(`重新处理完成: ${img.name}`, 'success');
      } catch {
        dispatch({ type: 'SET_IMAGE_STATUS', id, status: 'error' });
        dispatch({ type: 'INC_FAILED' });
        showToast(`处理失败: ${img.name}`, 'error');
      }
    },
    [state.images, state.results, state.postProcessedResults, state.settings, showToast]
  );

  const setActiveTab = useCallback((tab: AppState['activeTab']) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
  }, []);

  const setPreviewCompare = useCallback((payload: AppState['previewCompare']) => {
    dispatch({ type: 'SET_PREVIEW_COMPARE', payload });
  }, []);

  const setCurrentFrame = useCallback((frame: number) => {
    dispatch({ type: 'SET_CURRENT_FRAME', payload: frame });
  }, []);

  const setSequencePlaying = useCallback((playing: boolean) => {
    dispatch({ type: 'SET_SEQUENCE_PLAYING', payload: playing });
  }, []);

  const resetPromptToDefault = useCallback(() => {
    dispatch({ type: 'SET_SETTING', key: 'prompt', value: DEFAULT_PROMPT });
    removePrompt();
  }, []);

  const downloadAll = useCallback(async () => {
    if (state.results.size === 0) return;
    const zip = new JSZip();
    state.images.forEach((original) => {
      const dataUrl = state.results.get(original.id);
      if (dataUrl && original) {
        const baseName = original.name.replace(/\.[^/.]+$/, '');
        const base64 = dataUrl.split(',')[1];
        zip.file(`${baseName}_nobg.png`, base64, { base64: true });
      }
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = `抠图结果_${new Date().toISOString().slice(0, 10)}.zip`;
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
  }, [state.images, state.results]);

  const setGreenScreenSettings = useCallback((settings: Partial<GreenScreenSettings>) => {
    dispatch({ type: 'SET_GREEN_SCREEN_SETTINGS', payload: settings });
  }, []);

  const applyPostProcessing = useCallback(async () => {
    if (state.results.size === 0) {
      showToast('没有可处理的结果图片', 'warning');
      return;
    }

    dispatch({ type: 'CLEAR_POST_PROCESSED_RESULTS' });
    dispatch({ type: 'SET_POST_PROCESSING', payload: true });

    const entries = Array.from(state.results.entries());
    let processed = 0;

    for (const [id, dataUrl] of entries) {
      try {
        const result = await processGreenScreen(dataUrl, state.greenScreenSettings);
        dispatch({ type: 'SET_POST_PROCESSED_RESULT', id, dataUrl: result });
        processed++;
        dispatch({ type: 'SET_POST_PROCESS_PROGRESS', payload: Math.round((processed / entries.length) * 100) });
      } catch (err) {
        console.error('后处理失败:', err);
      }
    }

    dispatch({ type: 'SET_POST_PROCESSING', payload: false });
    showToast(`后处理完成！共处理 ${processed} 张图片`, 'success');
  }, [state.results, state.greenScreenSettings, showToast]);

  const downloadPostProcessed = useCallback(async () => {
    if (state.postProcessedResults.size === 0) return;
    const zip = new JSZip();
    state.images.forEach((original) => {
      const dataUrl = state.postProcessedResults.get(original.id);
      if (dataUrl && original) {
        const baseName = original.name.replace(/\.[^/.]+$/, '');
        const base64 = dataUrl.split(',')[1];
        zip.file(`${baseName}_processed.png`, base64, { base64: true });
      }
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = `后处理结果_${new Date().toISOString().slice(0, 10)}.zip`;
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
  }, [state.images, state.postProcessedResults]);

  // AI 智能选色功能
  const analyzeSmartColor = useCallback(async (imageId?: string) => {
    const { apiKey, model } = state.settings;
    if (!apiKey?.trim()) {
      showToast('请先设置 API Key', 'error');
      return;
    }

    // 选择要分析的图片
    let targetImage = imageId 
      ? state.images.find(img => img.id === imageId)
      : state.images[0];
    
    if (!targetImage) {
      showToast('请先上传图片', 'warning');
      return;
    }

    dispatch({ type: 'SET_SMART_COLOR', payload: { analyzing: true } });
    showToast(`正在分析图片颜色: ${targetImage.name}`, 'info');

    try {
      const result = await analyzeImageColors(
        apiKey.trim(),
        model,
        targetImage.data,
        targetImage.file.type,
        state.smartColor.customPrompt || undefined
      );

      dispatch({
        type: 'SET_SMART_COLOR_RECOMMENDATION',
        payload: {
          recommendation: result.bestChoice,
          analysis: result.analysis,
          sourceImageId: targetImage.id,
        },
      });

      showToast(`推荐使用 ${result.bestChoice.colorName} (${result.bestChoice.color})`, 'success');
    } catch (err) {
      dispatch({ type: 'SET_SMART_COLOR', payload: { analyzing: false } });
      showToast(`颜色分析失败: ${err instanceof Error ? err.message : '未知错误'}`, 'error');
    }
  }, [state.settings, state.images, state.smartColor.customPrompt, showToast]);

  const applySmartColor = useCallback(() => {
    const { recommendation } = state.smartColor;
    if (!recommendation) {
      showToast('请先进行颜色分析', 'warning');
      return;
    }

    // 更新提示词
    const newPrompt = generatePromptWithColor(recommendation.color, recommendation.colorName);
    dispatch({ type: 'SET_SETTING', key: 'prompt', value: newPrompt });

    // 更新后处理颜色
    dispatch({ type: 'SET_GREEN_SCREEN_SETTINGS', payload: { keyColor: recommendation.color } });

    // 标记为已启用
    dispatch({ type: 'SET_SMART_COLOR', payload: { enabled: true } });

    showToast(`已应用推荐颜色 ${recommendation.color}`, 'success');
  }, [state.smartColor, showToast]);

  const clearSmartColor = useCallback(() => {
    dispatch({ type: 'CLEAR_SMART_COLOR' });
    showToast('已清除智能选色', 'info');
  }, [showToast]);

  const setSmartColorPrompt = useCallback((prompt: string) => {
    dispatch({ type: 'SET_SMART_COLOR', payload: { customPrompt: prompt } });
  }, []);

  const setSmartColorEnabled = useCallback((enabled: boolean) => {
    if (enabled && state.smartColor.recommendation) {
      // 启用时应用颜色
      const { recommendation } = state.smartColor;
      const newPrompt = generatePromptWithColor(recommendation.color, recommendation.colorName);
      dispatch({ type: 'SET_SETTING', key: 'prompt', value: newPrompt });
      dispatch({ type: 'SET_GREEN_SCREEN_SETTINGS', payload: { keyColor: recommendation.color } });
    }
    dispatch({ type: 'SET_SMART_COLOR', payload: { enabled } });
  }, [state.smartColor]);

  const value: AppContextValue = {
    state,
    dispatch,
    loadSettingsOnMount,
    setSetting,
    addFiles,
    removeImage,
    startProcessing,
    togglePause,
    cancelProcessing,
    clearAll,
    retryImage,
    setActiveTab,
    setPreviewCompare,
    setCurrentFrame,
    setSequencePlaying,
    showToast,
    resetPromptToDefault,
    downloadAll,
    setGreenScreenSettings,
    applyPostProcessing,
    downloadPostProcessed,
    analyzeSmartColor,
    applySmartColor,
    clearSmartColor,
    setSmartColorPrompt,
    setSmartColorEnabled,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
