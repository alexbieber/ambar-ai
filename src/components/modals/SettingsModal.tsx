import { useUiStore } from '../../stores/uiStore';
import { useAiStore, type AIProvider } from '../../stores/aiStore';
import { useProjectStore } from '../../stores/projectStore';
import { Button } from '../ui/Button';
import { CLAUDE_MODELS, GEMINI_MODELS } from '../../utils/constants';
import { X } from 'lucide-react';

export function SettingsModal() {
  const setShowSettingsModal = useUiStore((s) => s.setShowSettingsModal);
  const showNotification = useUiStore((s) => s.showNotification);
  const clearProject = useProjectStore((s) => s.clearProject);
  const clearAllKeys = useAiStore((s) => s.clearAllKeys);
  const provider = useAiStore((s) => s.provider);
  const setProvider = useAiStore((s) => s.setProvider);
  const claudeModelId = useAiStore((s) => s.claudeModelId);
  const geminiModelId = useAiStore((s) => s.geminiModelId);
  const setClaudeModel = useAiStore((s) => s.setClaudeModel);
  const setGeminiModel = useAiStore((s) => s.setGeminiModel);

  const clearHistory = useProjectStore((s) => s.clearHistory);

  const handleClearAll = () => {
    clearAllKeys();
    clearProject();
    clearHistory();
    setShowSettingsModal(false);
    showNotification('All data cleared.', 'info');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={() => setShowSettingsModal(false)}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-extrabold text-lg text-white">Settings</h2>
          <button
            type="button"
            onClick={() => setShowSettingsModal(false)}
            className="p-2 rounded text-[var(--muted)] hover:bg-[var(--faint)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <p className="text-[9px] uppercase tracking-wider text-[var(--muted)] mb-2">Provider</p>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as AIProvider)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
            >
              <option value="auto">Auto (Gemini first, then Claude)</option>
              <option value="gemini">Google (Gemini)</option>
              <option value="anthropic">Anthropic (Claude)</option>
            </select>
          </div>

          <div className="space-y-3">
            <p className="text-[9px] uppercase tracking-wider text-[var(--muted)]">
              {provider === 'auto' ? 'Model versions (Auto uses Gemini first, then Claude)' : 'Model version'}
            </p>
            {(provider === 'auto' || provider === 'gemini') && (
              <div>
                <label className="text-[10px] text-[var(--muted)] block mb-1">Gemini</label>
                <select
                  value={geminiModelId}
                  onChange={(e) => setGeminiModel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                >
                  {GEMINI_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {(provider === 'auto' || provider === 'anthropic') && (
              <div>
                <label className="text-[10px] text-[var(--muted)] block mb-1">Claude</label>
                <select
                  value={claudeModelId}
                  onChange={(e) => setClaudeModel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                >
                  {CLAUDE_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <p className="text-[9px] uppercase tracking-wider text-[var(--muted)] mb-1">Theme</p>
            <p className="text-sm text-[var(--text)]">Dark (default)</p>
          </div>
          <div>
            <Button variant="secondary" onClick={handleClearAll} className="w-full">
              Clear all data
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
