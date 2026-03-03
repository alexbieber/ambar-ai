import { useEffect } from 'react';
import { IDELayout } from './components/layout/IDELayout';
import { ApiKeyModal } from './components/modals/ApiKeyModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { ShortcutsModal } from './components/modals/ShortcutsModal';
import { NotificationStack } from './components/ui/NotificationStack';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { useKeyboard } from './hooks/useKeyboard';
import { useAiStore } from './stores/aiStore';
import { useUiStore } from './stores/uiStore';

function App() {
  useKeyboard();

  const apiKey = useAiStore((s) => s.apiKey);
  const setShowApiKeyModal = useUiStore((s) => s.setShowApiKeyModal);
  const showApiKeyModal = useUiStore((s) => s.showApiKeyModal);
  const showSettingsModal = useUiStore((s) => s.showSettingsModal);
  const showShortcutsModal = useUiStore((s) => s.showShortcutsModal);

  useEffect(() => {
    if (!apiKey?.trim()) setShowApiKeyModal(true);
  }, []);

  return (
    <ErrorBoundary>
      <IDELayout />
      {showApiKeyModal && <ApiKeyModal />}
      {showSettingsModal && <SettingsModal />}
      {showShortcutsModal && <ShortcutsModal />}
      <NotificationStack />
    </ErrorBoundary>
  );
}

export default App;
