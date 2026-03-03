import { create } from 'zustand';
import type { NotificationType } from '../types';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  timestamp: number;
}

interface UiState {
  sidebarWidth: number;
  explorerWidth: number;
  previewWidth: number;
  showPreview: boolean;
  showExplorer: boolean;
  activeRightTab: 'code' | 'howto';
  theme: 'dark';
  showApiKeyModal: boolean;
  showSettingsModal: boolean;
  showShortcutsModal: boolean;
  notifications: Notification[];

  setSidebarWidth: (w: number) => void;
  setExplorerWidth: (w: number) => void;
  setPreviewWidth: (w: number) => void;
  togglePreview: () => void;
  toggleExplorer: () => void;
  setActiveRightTab: (tab: 'code' | 'howto') => void;
  showNotification: (message: string, type: Notification['type']) => void;
  dismissNotification: (id: string) => void;
  setShowApiKeyModal: (v: boolean) => void;
  setShowSettingsModal: (v: boolean) => void;
  setShowShortcutsModal: (v: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarWidth: 260,
  explorerWidth: 220,
  previewWidth: 320,
  showPreview: true,
  showExplorer: true,
  activeRightTab: 'code',
  theme: 'dark',
  showApiKeyModal: false,
  showSettingsModal: false,
  showShortcutsModal: false,
  notifications: [],

  // Allow collapsed width (28–40) for sidebar; expanded range 180–400
  setSidebarWidth: (w) =>
    set({ sidebarWidth: w <= 40 ? Math.max(28, Math.min(40, w)) : Math.max(180, Math.min(400, w)) }),

  setExplorerWidth: (w) =>
    set({ explorerWidth: w <= 40 ? Math.max(28, Math.min(40, w)) : Math.max(150, Math.min(350, w)) }),

  setPreviewWidth: (w) =>
    set({ previewWidth: w <= 40 ? Math.max(28, Math.min(40, w)) : Math.max(240, Math.min(500, w)) }),

  togglePreview: () => set((s) => ({ showPreview: !s.showPreview })),

  toggleExplorer: () => set((s) => ({ showExplorer: !s.showExplorer })),

  setActiveRightTab: (tab) => set({ activeRightTab: tab }),

  showNotification: (message, type) => {
    const id = `n-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    set((s) => ({
      notifications: [
        { id, message, type, timestamp: Date.now() },
        ...s.notifications.slice(0, 3),
      ],
    }));
  },

  dismissNotification: (id) => {
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) }));
  },

  setShowApiKeyModal: (v) => set({ showApiKeyModal: v }),

  setShowSettingsModal: (v) => set({ showSettingsModal: v }),

  setShowShortcutsModal: (v) => set({ showShortcutsModal: v }),
}));
