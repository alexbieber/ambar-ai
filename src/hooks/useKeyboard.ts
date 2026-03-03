import { useEffect } from 'react';
import { useUiStore } from '../stores/uiStore';
import { useProjectStore } from '../stores/projectStore';
import { useGenerate } from './useGenerate';

export function useKeyboard() {
  const setShowApiKeyModal = useUiStore((s) => s.setShowApiKeyModal);
  const setShowSettingsModal = useUiStore((s) => s.setShowSettingsModal);
  const setShowShortcutsModal = useUiStore((s) => s.setShowShortcutsModal);
  const togglePreview = useUiStore((s) => s.togglePreview);
  const toggleExplorer = useUiStore((s) => s.toggleExplorer);
  const sidebarWidth = useUiStore((s) => s.sidebarWidth);
  const setSidebarWidth = useUiStore((s) => s.setSidebarWidth);

  const openTabs = useProjectStore((s) => s.openTabs);
  const activeFilePath = useProjectStore((s) => s.activeFilePath);
  const setActiveFile = useProjectStore((s) => s.setActiveFile);
  const closeTab = useProjectStore((s) => s.closeTab);
  const project = useProjectStore((s) => s.project);

  const { generate } = useGenerate();

  useEffect(() => {
    const handle = async (e: KeyboardEvent) => {
      const target = document.activeElement as HTMLElement;
      const isInput = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';
      const meta = e.metaKey || e.ctrlKey;

      if (e.key === 'Escape') {
        setShowApiKeyModal(false);
        setShowSettingsModal(false);
        setShowShortcutsModal(false);
        return;
      }

      if (meta && e.key === 'k') {
        e.preventDefault();
        setShowApiKeyModal(true);
        return;
      }
      if (meta && e.key === ',') {
        e.preventDefault();
        setShowSettingsModal(true);
        return;
      }
      if (meta && e.key === 'b') {
        e.preventDefault();
        setSidebarWidth(sidebarWidth <= 40 ? 260 : 28);
        return;
      }
      if (meta && e.key === 'e') {
        e.preventDefault();
        toggleExplorer();
        return;
      }
      if (meta && e.key === 'p') {
        e.preventDefault();
        togglePreview();
        return;
      }
      if (meta && e.key === 'Enter' && isInput && !e.defaultPrevented) {
        // Only generate when focus is in the main prompt textarea, not Enhance
        if (target.getAttribute?.('data-purpose') === 'enhance') return;
        const textarea = target as HTMLTextAreaElement;
        if (textarea.value?.trim()) {
          e.preventDefault();
          generate(textarea.value.trim());
        }
        return;
      }
      if (meta && e.key === 's') {
        e.preventDefault();
        if (project && activeFilePath && project.files[activeFilePath]) {
          try {
            await navigator.clipboard.writeText(project.files[activeFilePath].content);
            useUiStore.getState().showNotification('Copied to clipboard', 'success');
          } catch {
            useUiStore.getState().showNotification('Clipboard access denied or failed', 'error');
          }
        }
        return;
      }
      if (meta && e.key === 'f') {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('[placeholder="Search files…"]')?.focus();
        return;
      }
      if (meta && e.key === 'w') {
        e.preventDefault();
        if (activeFilePath) closeTab(activeFilePath);
        return;
      }
      if (meta && e.key === 'Tab') {
        e.preventDefault();
        if (openTabs.length > 0 && activeFilePath) {
          const idx = openTabs.indexOf(activeFilePath);
          const next = openTabs[(idx + 1) % openTabs.length];
          setActiveFile(next);
        }
        return;
      }
      if (meta && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const idx = parseInt(e.key, 10) - 1;
        if (openTabs[idx]) setActiveFile(openTabs[idx]);
        return;
      }
    };

    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [
    sidebarWidth,
    setSidebarWidth,
    toggleExplorer,
    togglePreview,
    setShowApiKeyModal,
    setShowSettingsModal,
    setShowShortcutsModal,
    openTabs,
    activeFilePath,
    setActiveFile,
    closeTab,
    project,
    generate,
  ]);
}
