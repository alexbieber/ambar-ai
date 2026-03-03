export const MODEL = 'claude-sonnet-4-20250514';
export const GEMINI_MODEL = 'gemini-2.0-flash';

export const CLAUDE_MODELS: { id: string; label: string }[] = [
  { id: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4 (latest)' },
  { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
  { id: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
  { id: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku (fast)' },
];

export const GEMINI_MODELS: { id: string; label: string }[] = [
  { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (recommended)' },
  { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
  { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
];

export const MAX_TOKENS_PROJECT = 8000;
export const MAX_TOKENS_PREVIEW = 3000;
export const MAX_TOKENS_EDIT = 4000;

export {
  FLUTTER_SYSTEM_PROMPT,
  ENHANCE_SYSTEM_PROMPT,
  PREVIEW_SYSTEM_PROMPT,
  CODE_TO_HTML_PREVIEW_PROMPT,
  EDIT_SYSTEM_PROMPT,
} from '../agent/prompts';

/** Max total chars sent in enhance request to avoid context overflow. */
export const ENHANCE_MAX_TOTAL_CHARS = 60_000;
/** Max chars per file in enhance request. */
export const ENHANCE_MAX_PER_FILE = 8_000;
/** Max chars for app description + enhancements in enhance request. */
export const ENHANCE_MAX_DESCRIPTION_CHARS = 12_000;

export const EXAMPLE_PROMPTS = [
  { icon: '📱', label: 'Social feed app with posts, likes, and comments' },
  { icon: '✅', label: 'Productivity app with tasks, due dates, and categories' },
  { icon: '❤️', label: 'Health tracker with workouts and progress charts' },
  { icon: '💰', label: 'Finance app with expenses, budgets, and summaries' },
  { icon: '📚', label: 'Education app with lessons and quizzes' },
  { icon: '🎬', label: 'Entertainment app with content discovery and favorites' },
  { icon: '🔧', label: 'Utility app with tools and quick actions' },
  { icon: '🎮', label: 'Simple game with score and levels' },
] as const;

export const SUPPORTED_LANGUAGES: Record<string, string> = {
  dart: 'dart',
  yaml: 'yaml',
  yml: 'yaml',
  json: 'json',
  xml: 'xml',
  gradle: 'plaintext',
  md: 'markdown',
  txt: 'plaintext',
};
