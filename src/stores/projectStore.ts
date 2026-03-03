import { create } from 'zustand';
import type { Project } from '../types';

const HISTORY_MAX = 5;
const HISTORY_KEY = 'flutterforge_history';

function loadHistoryFromStorage(): Project[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, HISTORY_MAX) : [];
  } catch {
    return [];
  }
}

function saveHistoryToStorage(history: Project[]) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, HISTORY_MAX)));
  } catch {
    // ignore quota or other errors
  }
}

interface ProjectState {
  project: Project | null;
  activeFilePath: string | null;
  openTabs: string[];
  history: Project[];
  /** Single snapshot for "Undo last enhance" */
  preEnhanceSnapshot: Project | null;

  setProject: (project: Project) => void;
  /** Set project but keep open tabs / active file when they exist in the new project (e.g. after enhance). */
  setProjectPreservingTabs: (project: Project) => void;
  setActiveFile: (path: string) => void;
  closeTab: (path: string) => void;
  updateFileContent: (path: string, content: string) => void;
  clearProject: () => void;
  clearHistory: () => void;
  addToHistory: (project: Project) => void;
  loadFromHistory: (index: number) => void;
  setPreEnhanceSnapshot: (project: Project | null) => void;
  undoLastEnhance: () => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  project: null,
  activeFilePath: null,
  openTabs: [],
  history: loadHistoryFromStorage(),
  preEnhanceSnapshot: null,

  setProject: (project) => {
    set({ project, activeFilePath: null, openTabs: [] });
    const mainPath = 'lib/main.dart';
    const files = project.files;
    const firstPath = mainPath in files ? mainPath : Object.keys(files)[0];
    if (firstPath) get().setActiveFile(firstPath);
  },

  setProjectPreservingTabs: (project) => {
    const { openTabs, activeFilePath } = get();
    const paths = Object.keys(project.files);
    const mainPath = 'lib/main.dart';
    const firstPath = mainPath in project.files ? mainPath : paths[0];
    const keptTabs = openTabs.filter((p) => p in project.files);
    const keptActive =
      activeFilePath && activeFilePath in project.files
        ? activeFilePath
        : keptTabs[0] ?? firstPath;
    const openTabsNext =
      keptTabs.length > 0 ? keptTabs : (firstPath ? [firstPath] : []);
    const activeNext = keptActive ?? null;
    set({ project, openTabs: openTabsNext, activeFilePath: activeNext });
    if (activeNext && !openTabsNext.includes(activeNext)) {
      get().setActiveFile(activeNext);
    }
  },

  setActiveFile: (path) => {
    const { openTabs } = get();
    const nextTabs = openTabs.includes(path) ? openTabs : [...openTabs, path];
    set({ activeFilePath: path, openTabs: nextTabs });
  },

  closeTab: (path) => {
    const { openTabs, activeFilePath } = get();
    const idx = openTabs.indexOf(path);
    if (idx === -1) return;
    const nextTabs = openTabs.filter((p) => p !== path);
    let nextActive = activeFilePath;
    if (activeFilePath === path) {
      if (nextTabs.length > 0) {
        nextActive = idx > 0 ? openTabs[idx - 1] : nextTabs[0];
      } else {
        nextActive = null;
      }
    }
    set({ openTabs: nextTabs, activeFilePath: nextActive });
  },

  updateFileContent: (path, content) => {
    const { project } = get();
    if (!project || !project.files[path]) return;
    set({
      project: {
        ...project,
        files: {
          ...project.files,
          [path]: {
            ...project.files[path],
            content,
            isDirty: true,
            lastModified: Date.now(),
          },
        },
      },
    });
  },

  clearProject: () => set({ project: null, activeFilePath: null, openTabs: [] }),

  clearHistory: () => {
    set({ history: [] });
    saveHistoryToStorage([]);
  },

  addToHistory: (project) => {
    set((s) => {
      const next = [project, ...s.history.slice(0, HISTORY_MAX - 1)];
      saveHistoryToStorage(next);
      return { history: next };
    });
  },

  loadFromHistory: (index) => {
    const { history } = get();
    if (index < 0 || index >= history.length) return;
    const p = history[index];
    if (p) get().setProject(p);
  },

  setPreEnhanceSnapshot: (project) => set({ preEnhanceSnapshot: project }),

  undoLastEnhance: () => {
    const { preEnhanceSnapshot } = get();
    if (preEnhanceSnapshot) {
      set({ project: preEnhanceSnapshot, preEnhanceSnapshot: null });
      const mainPath = 'lib/main.dart';
      const firstPath =
        mainPath in preEnhanceSnapshot.files
          ? mainPath
          : Object.keys(preEnhanceSnapshot.files)[0];
      if (firstPath) get().setActiveFile(firstPath);
    }
  },
}));

// Derived selectors — use in components: useProjectStore(selector)
// activeFile: useProjectStore(s => s.project && s.activeFilePath ? s.project.files[s.activeFilePath] ?? null : null)
// fileCount: useProjectStore(s => s.project ? Object.keys(s.project.files).length : 0)
// totalLines: useProjectStore(s => { if (!s.project) return 0; return Object.values(s.project.files).reduce((n, f) => n + (f.content.split(/\n/).length), 0); })
// dirtyFiles: useProjectStore(s => s.project ? Object.entries(s.project.files).filter(([,f]) => f.isDirty).map(([p]) => p) : [])
