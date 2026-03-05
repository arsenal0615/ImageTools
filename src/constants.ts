export const DEFAULT_PROMPT = `Remove the background from this image.

CRITICAL - READ CAREFULLY:

1. Output a PNG image with REAL ALPHA TRANSPARENCY (not a checkerboard pattern!)
2. Do NOT draw a checkerboard/checkered pattern as background
3. Do NOT draw gray and white squares as background  
4. The background must be ACTUAL TRANSPARENT PIXELS (alpha = 0), not a visual pattern
5. Keep the subject EXACTLY as it is - do not modify, redraw, or enhance anything
6. Output dimensions must match input dimensions exactly
7. Preserve every single pixel of the subject without any changes

WRONG: Drawing a checkerboard pattern behind the subject
CORRECT: Setting background pixels to transparent (alpha channel = 0)

This is for sprite animation - any modification will break the animation.
Just cut out the subject with pixel-perfect accuracy and set background to true transparency.`;

export interface ModelOption {
  value: string;
  label: string;
}

export interface ModelGroup {
  label: string;
  options: ModelOption[];
}

export const MODEL_OPTIONS: ModelGroup[] = [
  {
    label: '── 图像生成专用 ──',
    options: [
      { value: 'gemini-2.0-flash-exp-image-generation', label: 'gemini-2.0-flash-exp-image-generation (推荐)' },
      { value: 'gemini-2.5-flash-image', label: 'gemini-2.5-flash-image' },
      { value: 'gemini-3-pro-image-preview', label: 'gemini-3-pro-image-preview' },
      { value: 'gemini-3.1-flash-image-preview', label: 'gemini-3.1-flash-image-preview' },
    ],
  },
  {
    label: '── Gemini 3.x 系列 ──',
    options: [
      { value: 'gemini-3-pro-preview', label: 'gemini-3-pro-preview' },
      { value: 'gemini-3-flash-preview', label: 'gemini-3-flash-preview' },
      { value: 'gemini-3.1-pro-preview', label: 'gemini-3.1-pro-preview' },
      { value: 'gemini-3.1-flash-lite-preview', label: 'gemini-3.1-flash-lite-preview' },
    ],
  },
  {
    label: '── Gemini 2.5 系列 ──',
    options: [
      { value: 'gemini-2.5-pro', label: 'gemini-2.5-pro' },
      { value: 'gemini-2.5-flash', label: 'gemini-2.5-flash' },
      { value: 'gemini-2.5-flash-lite', label: 'gemini-2.5-flash-lite' },
    ],
  },
  {
    label: '── Gemini 2.0 系列 ──',
    options: [
      { value: 'gemini-2.0-flash', label: 'gemini-2.0-flash' },
      { value: 'gemini-2.0-flash-lite', label: 'gemini-2.0-flash-lite' },
    ],
  },
];

export const STORAGE_KEYS = {
  API_KEY: 'gemini_api_key',
  MODEL: 'gemini_model',
  PROMPT: 'gemini_prompt',
} as const;
