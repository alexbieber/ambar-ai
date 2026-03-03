import { create } from 'zustand';
import type { GenerationStep, ChatMessage } from '../types';

export type AIProvider = 'anthropic' | 'gemini' | 'auto';

const ANTHROPIC_KEY = 'flutterforge_anthropic_key';
const GEMINI_KEY = 'flutterforge_gemini_key';
const PROVIDER_KEY = 'flutterforge_ai_provider';
const CLAUDE_MODEL_KEY = 'flutterforge_claude_model';
const GEMINI_MODEL_KEY = 'flutterforge_gemini_model';

function isValidAnthropicKey(key: string): boolean {
  return /^sk-ant-/.test(key.trim());
}

function isValidGeminiKey(key: string): boolean {
  return key.trim().length >= 20 && /^AIza/.test(key.trim());
}

interface AiState {
  provider: AIProvider;
  anthropicApiKey: string;
  geminiApiKey: string;
  apiKey: string; // derived: current provider's key
  /** Selected model id per provider (used when provider is anthropic or gemini) */
  claudeModelId: string;
  geminiModelId: string;
  isConnected: boolean;
  isLoading: boolean;
  currentStep: string;
  progress: number;
  steps: GenerationStep[];
  chatHistory: ChatMessage[];
  lastError: string | null;
  /** Raw API response when parse failed (for "Copy raw response") */
  lastParseFailureRaw: string | null;
  streamingContent: string;
  generatedFilePaths: string[];
  /** 'generate' | 'enhance' while that operation is running; null otherwise. */
  operationType: 'generate' | 'enhance' | null;

  setProvider: (p: AIProvider) => void;
  setClaudeModel: (modelId: string) => void;
  setGeminiModel: (modelId: string) => void;
  setAnthropicKey: (key: string) => void;
  setGeminiKey: (key: string) => void;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  clearAllKeys: () => void;
  /** Resolve effective provider for API call: auto -> gemini if key set else anthropic */
  getEffectiveProvider: () => 'anthropic' | 'gemini';
  getEffectiveApiKey: () => string;
  getEffectiveModelId: (forProvider?: 'anthropic' | 'gemini') => string;
  setLoading: (loading: boolean) => void;
  setStep: (step: string, progress: number) => void;
  setSteps: (steps: GenerationStep[]) => void;
  updateStepStatus: (id: string, status: GenerationStep['status'], detail?: string) => void;
  addChatMessage: (msg: ChatMessage) => void;
  setLastError: (error: string | null) => void;
  setLastParseFailureRaw: (raw: string | null) => void;
  clearError: () => void;
  appendStreamingChunk: (chunk: string) => void;
  addGeneratedFilePath: (path: string) => void;
  clearGenerationLive: () => void;
  setOperationType: (type: 'generate' | 'enhance' | null) => void;
}

function getStored(key: string): string {
  if (typeof localStorage === 'undefined') return '';
  return localStorage.getItem(key) ?? '';
}

const DEFAULT_CLAUDE_MODEL = 'claude-sonnet-4-20250514';
const DEFAULT_GEMINI_MODEL = 'gemini-2.0-flash';

function loadInitialKeys(): {
  provider: AIProvider;
  anthropicApiKey: string;
  geminiApiKey: string;
  claudeModelId: string;
  geminiModelId: string;
} {
  const legacyKey = getStored('flutterforge_api_key');
  let anthropicApiKey = getStored(ANTHROPIC_KEY);
  const geminiApiKey = getStored(GEMINI_KEY);
  if (legacyKey && !anthropicApiKey && isValidAnthropicKey(legacyKey)) {
    anthropicApiKey = legacyKey;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ANTHROPIC_KEY, legacyKey);
      localStorage.removeItem('flutterforge_api_key');
    }
  }
  const provider = (getStored(PROVIDER_KEY) as AIProvider) || 'anthropic';
  const claudeModelId = getStored(CLAUDE_MODEL_KEY) || DEFAULT_CLAUDE_MODEL;
  const geminiModelId = getStored(GEMINI_MODEL_KEY) || DEFAULT_GEMINI_MODEL;
  return { provider, anthropicApiKey, geminiApiKey, claudeModelId, geminiModelId };
}

function deriveApiKeyAndConnected(
  provider: AIProvider,
  anthropicApiKey: string,
  geminiApiKey: string
): { apiKey: string; isConnected: boolean } {
  if (provider === 'anthropic') {
    return { apiKey: anthropicApiKey, isConnected: isValidAnthropicKey(anthropicApiKey) };
  }
  if (provider === 'gemini') {
    return { apiKey: geminiApiKey, isConnected: isValidGeminiKey(geminiApiKey) };
  }
  // auto: prefer Gemini if key set, else Anthropic
  if (isValidGeminiKey(geminiApiKey)) {
    return { apiKey: geminiApiKey, isConnected: true };
  }
  if (isValidAnthropicKey(anthropicApiKey)) {
    return { apiKey: anthropicApiKey, isConnected: true };
  }
  return { apiKey: geminiApiKey || anthropicApiKey, isConnected: false };
}

export const useAiStore = create<AiState>((set, get) => {
  const { provider, anthropicApiKey, geminiApiKey, claudeModelId, geminiModelId } = loadInitialKeys();
  const { apiKey, isConnected } = deriveApiKeyAndConnected(provider, anthropicApiKey, geminiApiKey);

  return {
    provider,
    anthropicApiKey,
    geminiApiKey,
    claudeModelId,
    geminiModelId,
    apiKey,
    isConnected,
    isLoading: false,
    currentStep: '',
    progress: 0,
    steps: [],
    chatHistory: [],
    lastError: null,
    lastParseFailureRaw: null,
    streamingContent: '',
    generatedFilePaths: [],
    operationType: null,

    setProvider: (p) => {
      if (typeof localStorage !== 'undefined') localStorage.setItem(PROVIDER_KEY, p);
      const state = get();
      const { apiKey: key, isConnected: connected } = deriveApiKeyAndConnected(
        p,
        state.anthropicApiKey,
        state.geminiApiKey
      );
      set({ provider: p, apiKey: key, isConnected: connected });
    },

    setClaudeModel: (modelId) => {
      if (typeof localStorage !== 'undefined') localStorage.setItem(CLAUDE_MODEL_KEY, modelId);
      set({ claudeModelId: modelId });
    },

    setGeminiModel: (modelId) => {
      if (typeof localStorage !== 'undefined') localStorage.setItem(GEMINI_MODEL_KEY, modelId);
      set({ geminiModelId: modelId });
    },

    setAnthropicKey: (key) => {
      const k = key.trim();
      if (typeof localStorage !== 'undefined') {
        if (k) localStorage.setItem(ANTHROPIC_KEY, k);
        else localStorage.removeItem(ANTHROPIC_KEY);
      }
      const state = get();
      const isNow = state.provider === 'anthropic' || (state.provider === 'auto' && !isValidGeminiKey(state.geminiApiKey));
      const { apiKey: newApiKey, isConnected: newConnected } = deriveApiKeyAndConnected(state.provider, k, state.geminiApiKey);
      set({
        anthropicApiKey: k,
        ...(isNow ? { apiKey: newApiKey, isConnected: newConnected } : {}),
        lastError: null,
      });
    },

    setGeminiKey: (key) => {
      const k = key.trim();
      if (typeof localStorage !== 'undefined') {
        if (k) localStorage.setItem(GEMINI_KEY, k);
        else localStorage.removeItem(GEMINI_KEY);
      }
      const state = get();
      const isNow = state.provider === 'gemini' || (state.provider === 'auto' && isValidGeminiKey(k));
      const { apiKey: newApiKey, isConnected: newConnected } = deriveApiKeyAndConnected(state.provider, state.anthropicApiKey, k);
      set({
        geminiApiKey: k,
        ...(isNow ? { apiKey: newApiKey, isConnected: newConnected } : {}),
        lastError: null,
      });
    },

    setApiKey: (key) => {
      const k = key.trim();
      const p = get().provider;
      if (p === 'anthropic') {
        if (typeof localStorage !== 'undefined') {
          if (k) localStorage.setItem(ANTHROPIC_KEY, k);
          else localStorage.removeItem(ANTHROPIC_KEY);
        }
        set({
          anthropicApiKey: k,
          apiKey: k,
          isConnected: isValidAnthropicKey(k),
          lastError: null,
        });
      } else {
        if (typeof localStorage !== 'undefined') {
          if (k) localStorage.setItem(GEMINI_KEY, k);
          else localStorage.removeItem(GEMINI_KEY);
        }
        set({
          geminiApiKey: k,
          apiKey: k,
          isConnected: isValidGeminiKey(k),
          lastError: null,
        });
      }
    },

    clearApiKey: () => {
      const eff = get().getEffectiveProvider();
      if (eff === 'anthropic') {
        if (typeof localStorage !== 'undefined') localStorage.removeItem(ANTHROPIC_KEY);
        set((s) => {
          const { apiKey: key, isConnected } = deriveApiKeyAndConnected(s.provider, '', s.geminiApiKey);
          return { anthropicApiKey: '', apiKey: key, isConnected };
        });
      } else {
        if (typeof localStorage !== 'undefined') localStorage.removeItem(GEMINI_KEY);
        set((s) => {
          const { apiKey: key, isConnected } = deriveApiKeyAndConnected(s.provider, s.anthropicApiKey, '');
          return { geminiApiKey: '', apiKey: key, isConnected };
        });
      }
    },

    clearAllKeys: () => {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(ANTHROPIC_KEY);
        localStorage.removeItem(GEMINI_KEY);
      }
      set({
        anthropicApiKey: '',
        geminiApiKey: '',
        apiKey: '',
        isConnected: false,
      });
    },

    setLoading: (loading) => set({ isLoading: loading }),

    setStep: (step, progress) => set({ currentStep: step, progress }),

    setSteps: (steps) => set({ steps }),

    updateStepStatus: (id, status, detail) => {
      set((s) => ({
        steps: s.steps.map((st) =>
          st.id === id ? { ...st, status, ...(detail != null ? { detail } : {}) } : st
        ),
      }));
    },

    addChatMessage: (msg) => {
      set((s) => ({ chatHistory: [...s.chatHistory, msg] }));
    },

    setLastError: (error) => set({ lastError: error }),

    setLastParseFailureRaw: (raw) => set({ lastParseFailureRaw: raw }),

    clearError: () => set({ lastError: null, lastParseFailureRaw: null }),

    appendStreamingChunk: (chunk) =>
      set((s) => ({
        streamingContent: (s.streamingContent + chunk).slice(-4000),
      })),

    addGeneratedFilePath: (path) =>
      set((s) => ({ generatedFilePaths: [...s.generatedFilePaths, path] })),

    clearGenerationLive: () => set({ streamingContent: '', generatedFilePaths: [] }),

    setOperationType: (type) => set({ operationType: type }),

    getEffectiveProvider: () => {
      const s = get();
      if (s.provider === 'anthropic' || s.provider === 'gemini') return s.provider;
      return isValidGeminiKey(s.geminiApiKey) ? 'gemini' : 'anthropic';
    },

    getEffectiveApiKey: () => {
      const s = get();
      const eff = s.getEffectiveProvider();
      return eff === 'anthropic' ? s.anthropicApiKey : s.geminiApiKey;
    },

    getEffectiveModelId: (forProvider?: 'anthropic' | 'gemini') => {
      const s = get();
      const eff = forProvider ?? s.getEffectiveProvider();
      return eff === 'anthropic' ? s.claudeModelId : s.geminiModelId;
    },
  };
});
