import { create } from 'zustand';
import type { Project } from '../types';

const HISTORY_MAX = 5;

interface ProjectState {
  project: Project | null;
  activeFilePath: string | null;
  openTabs: string[];
  history: Project[];

  setProject: (project: Project) => void;
  setActiveFile: (path: string) => void;
  closeTab: (path: string) => void;
  updateFileContent: (path: string, content: string) => void;
  clearProject: () => void;
  addToHistory: (project: Project) => void;
  loadFromHistory: (index: number) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  project: null,
  activeFilePath: null,
  openTabs: [],
  history: [],

  setProject: (project) => {
    set({ project, activeFilePath: null, openTabs: [] });
    const mainPath = 'lib/main.dart';
    const files = project.files;
    const firstPath = mainPath in files ? mainPath : Object.keys(files)[0];
    if (firstPath) get().setActiveFile(firstPath);
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

  addToHistory: (project) => {
    set((s) => ({
      history: [project, ...s.history.slice(0, HISTORY_MAX - 1)],
    }));
  },

  loadFromHistory: (index) => {
    const { history } = get();
    const p = history[index];
    if (p) get().setProject(p);
  },
}));

// Derived selectors — use in components: useProjectStore(selector)
// activeFile: useProjectStore(s => s.project && s.activeFilePath ? s.project.files[s.activeFilePath] ?? null : null)
// fileCount: useProjectStore(s => s.project ? Object.keys(s.project.files).length : 0)
// totalLines: useProjectStore(s => { if (!s.project) return 0; return Object.values(s.project.files).reduce((n, f) => n + (f.content.split(/\n/).length), 0); })
// dirtyFiles: useProjectStore(s => s.project ? Object.entries(s.project.files).filter(([,f]) => f.isDirty).map(([p]) => p) : [])
