export const DEFAULT_PROMPT = `移除此图像的背景，将背景替换为纯绿色（#00FF00 绿幕）。

非常重要 - 请仔细阅读：

1. 将背景替换为纯绿色 #00FF00（标准绿幕色），不要使用透明或棋盘格
2. 主体边缘需要自然过渡，保持轻微的边缘羽化效果
3. 保持主体与原来完全一致 - 不要修改、重绘或增强主体内容
4. 输出尺寸必须与输入尺寸完全一致
5. 保留主体的每一个像素，不作任何更改
6. 确保绿幕颜色均匀一致，便于后期处理

这是用于精灵图动画的绿幕抠图 - 任何对主体的修改都会破坏动画。
只需以像素级的精度保留主体，并将背景设置为纯绿色 #00FF00。`;

export const TRANSPARENT_PROMPT = `移除此图像的背景。

非常重要 - 请仔细阅读：

1. 输出带有真实 Alpha 透明度的 PNG 图像（不是棋盘格图案！）
2. 不要将棋盘格/方格图案绘制为背景
3. 不要将灰白相间的方块绘制为背景
4. 背景必须是实际的透明像素（Alpha = 0），而不是视觉图案
5. 保持主体与原来完全一致 - 不要修改、重绘或增强任何内容
6. 输出尺寸必须与输入尺寸完全一致
7. 保留主体的每一个像素，不作任何更改

错误做法：在主体后面绘制棋盘格图案
正确做法：将背景像素设置为透明（Alpha 通道 = 0）

这是用于精灵图动画的 - 任何修改都会破坏动画。
只需以像素级的精度抠出主体，并将背景设置为真正的透明。

【重要】禁止在输出图像上绘制、书写或显示任何文字、说明、标签或提示词内容。只输出纯图像（透明背景），不要有任何文字叠加。`;

export const PROMPT_PRESETS = [
  { id: 'greenscreen', label: '绿幕模式（推荐）', prompt: DEFAULT_PROMPT },
  { id: 'transparent', label: '透明背景模式', prompt: TRANSPARENT_PROMPT },
] as const;

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
