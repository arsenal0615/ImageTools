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
import { loadSettings, saveApiKey, saveModel, savePrompt, removePrompt } from '../utils/storage';
import { DEFAULT_PROMPT } from '../constants';
import JSZip from 'jszip';
import type { AppState, Settings, ImageItem, ToastItem } from '../types';

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
  | { type: 'REMOVE_TOAST'; id: string };

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
        completed: 0,
        failed: 0,
        currentFrame: 0,
        previewCompare: null,
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
    dispatch({ type: 'RESET_PROGRESS' });
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
          return;
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
      if (state.results.has(id)) dispatch({ type: 'DELETE_RESULT', id });
      dispatch({ type: 'SET_IMAGE_STATUS', id, status: 'pending' });
      const { apiKey, model, prompt } = state.settings;
      if (!apiKey?.trim()) return;
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
      } catch {
        dispatch({ type: 'SET_IMAGE_STATUS', id, status: 'error' });
        dispatch({ type: 'INC_FAILED' });
      }
    },
    [state.images, state.results, state.settings]
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
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
