import { STORAGE_KEYS } from '../constants';

export interface LoadedSettings {
  apiKey: string;
  model: string | null;
  prompt: string | null;
}

export function loadSettings(): LoadedSettings {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY ?? '';
  return {
    apiKey: localStorage.getItem(STORAGE_KEYS.API_KEY) || envKey,
    model: localStorage.getItem(STORAGE_KEYS.MODEL),
    prompt: localStorage.getItem(STORAGE_KEYS.PROMPT),
  };
}

export function saveApiKey(value: string): void {
  localStorage.setItem(STORAGE_KEYS.API_KEY, value);
}

export function saveModel(value: string): void {
  localStorage.setItem(STORAGE_KEYS.MODEL, value);
}

export function savePrompt(value: string): void {
  localStorage.setItem(STORAGE_KEYS.PROMPT, value);
}

export function removePrompt(): void {
  localStorage.removeItem(STORAGE_KEYS.PROMPT);
}
