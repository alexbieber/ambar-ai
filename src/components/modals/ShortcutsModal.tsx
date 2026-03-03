import { useUiStore } from '../../stores/uiStore';
import { X } from 'lucide-react';

const SHORTCUTS = [
  { keys: '⌘ ↵', desc: 'Generate project' },
  { keys: '⌘ B', desc: 'Toggle sidebar' },
  { keys: '⌘ E', desc: 'Toggle explorer' },
  { keys: '⌘ P', desc: 'Toggle preview' },
  { keys: '⌘ K', desc: 'Open API key modal' },
  { keys: '⌘ ,', desc: 'Open settings' },
  { keys: '⌘ S', desc: 'Copy active file' },
  { keys: '⌘ F', desc: 'Focus file search' },
  { keys: '⌘ W', desc: 'Close active tab' },
  { keys: 'Escape', desc: 'Close modal / exit edit mode' },
];

export function ShortcutsModal() {
  const setShowShortcutsModal = useUiStore((s) => s.setShowShortcutsModal);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={() => setShowShortcutsModal(false)}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-extrabold text-lg text-white">Keyboard shortcuts</h2>
          <button
            type="button"
            onClick={() => setShowShortcutsModal(false)}
            className="p-2 rounded text-[var(--muted)] hover:bg-[var(--faint)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <dl className="space-y-2">
          {SHORTCUTS.map(({ keys, desc }) => (
            <div key={keys} className="flex justify-between items-center py-2 border-b border-[var(--border)] last:border-0">
              <dt className="text-sm text-[var(--text)]">{desc}</dt>
              <dd className="font-mono text-xs px-2 py-1 rounded bg-[var(--faint)] text-[var(--muted)]">
                {keys}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
