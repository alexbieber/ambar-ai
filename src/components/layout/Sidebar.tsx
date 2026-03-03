import { useState, useCallback, useRef, useEffect } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { useAiStore } from '../../stores/aiStore';
import { useUiStore } from '../../stores/uiStore';
import { useGenerate } from '../../hooks/useGenerate';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { Tag } from '../ui/Tag';
import { EXAMPLE_PROMPTS } from '../../utils/constants';
import { AlertCircle, X, FileCode, Copy, Undo2 } from 'lucide-react';
import { clsx } from 'clsx';

export function Sidebar() {
  const [prompt, setPrompt] = useState('');
  const [enhanceInstruction, setEnhanceInstruction] = useState('');

  const project = useProjectStore((s) => s.project);
  const history = useProjectStore((s) => s.history);
  const loadFromHistory = useProjectStore((s) => s.loadFromHistory);
  const preEnhanceSnapshot = useProjectStore((s) => s.preEnhanceSnapshot);
  const undoLastEnhance = useProjectStore((s) => s.undoLastEnhance);

  const apiKey = useAiStore((s) => s.apiKey);
  const lastError = useAiStore((s) => s.lastError);
  const lastParseFailureRaw = useAiStore((s) => s.lastParseFailureRaw);
  const clearError = useAiStore((s) => s.clearError);
  const currentStep = useAiStore((s) => s.currentStep);
  const progress = useAiStore((s) => s.progress);
  const streamingContent = useAiStore((s) => s.streamingContent);
  const generatedFilePaths = useAiStore((s) => s.generatedFilePaths);

  const streamPreRef = useRef<HTMLPreElement>(null);
  useEffect(() => {
    if (streamingContent && streamPreRef.current) {
      streamPreRef.current.scrollTop = streamPreRef.current.scrollHeight;
    }
  }, [streamingContent]);

  const { generate, enhance, isGenerating, steps: genSteps, operationType } = useGenerate();

  const canGenerate = Boolean(prompt.trim() && apiKey && !isGenerating);
  const canEnhance = Boolean(project && enhanceInstruction.trim() && apiKey && !isGenerating);

  const handleGenerate = useCallback(() => {
    if (!canGenerate) return;
    generate(prompt);
  }, [canGenerate, prompt, generate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      handleGenerate();
    }
  };

  const handleEnhance = useCallback(() => {
    if (!canEnhance) return;
    enhance(enhanceInstruction, { onSuccess: () => setEnhanceInstruction('') });
  }, [canEnhance, enhanceInstruction, enhance]);

  return (
    <aside className="h-full flex flex-col bg-[var(--panel)] border-r border-[var(--border)] overflow-hidden">
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 flex flex-col gap-4">
        {/* Section 1: Prompt Input */}
        <div>
          <label className="block text-[9px] uppercase tracking-wider text-accent mb-2">
            App description
          </label>
          <textarea
            data-purpose="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your Flutter app in detail…&#10;&#10;Be specific about screens,&#10;features, and design style."
            rows={7}
            className="w-full px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] font-mono text-xs resize-none focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
          />
          <p className="text-[9px] text-[var(--faint)] text-right mt-1">⌘ ↵ to generate</p>
        </div>

        {/* Section 2: Generate Button */}
        <Button
          className="w-full bg-gradient-to-r from-accent to-violet text-[var(--bg)] font-display font-bold py-3 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent/20 active:translate-y-0 disabled:opacity-50 disabled:translate-y-0"
          disabled={!canGenerate}
          onClick={handleGenerate}
        >
          {isGenerating ? (
            <span className="flex flex-col items-center justify-center gap-1">
              <span className="flex items-center gap-2">
                <Spinner size="sm" className="text-[var(--bg)]" />
                {progress}%
              </span>
              {currentStep && (
                <span className="text-[10px] font-normal opacity-90 truncate max-w-full" title={currentStep}>
                  {currentStep}
                </span>
              )}
            </span>
          ) : (
            '⚡ Generate Project'
          )}
        </Button>

        {/* Enhance: when a project is loaded */}
        {project && (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 space-y-2">
            <label className="block text-[9px] uppercase tracking-wider text-accent">
              Enhance this project
            </label>
            <textarea
              data-purpose="enhance"
              value={enhanceInstruction}
              onChange={(e) => setEnhanceInstruction(e.target.value)}
              placeholder="e.g. Add dark mode, Add a settings screen, Make buttons bigger…"
              rows={2}
              className="w-full px-2 py-1.5 rounded bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] font-mono text-xs resize-none focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <div className="flex gap-2">
              <Button
                className="flex-1 py-2 bg-violet/80 hover:bg-violet text-white text-xs font-medium disabled:opacity-50"
                disabled={!canEnhance}
                onClick={handleEnhance}
              >
                {isGenerating ? 'Enhancing…' : '✨ Enhance'}
              </Button>
              {preEnhanceSnapshot && !isGenerating && (
                <button
                  type="button"
                  onClick={() => undoLastEnhance()}
                  className="px-2 py-2 rounded border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--faint)] text-xs flex items-center gap-1"
                  title="Undo last enhance"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  Undo
                </button>
              )}
            </div>
          </div>
        )}

        {/* Section 3: Generation progress — every step visible */}
        {isGenerating && (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-wider text-accent">Progress</span>
              <span className="text-[10px] font-mono text-[var(--muted)]">{progress}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[var(--faint)] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent to-violet transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            {currentStep && (
              <p className="text-xs font-medium text-accent truncate" title={currentStep}>
                ⟳ {currentStep}
              </p>
            )}
            {operationType === 'enhance' ? (
              <div className="pt-1 border-t border-[var(--border)]">
                <p className="text-xs text-accent">⟳ {currentStep || 'Enhancing…'}</p>
              </div>
            ) : genSteps.length > 0 ? (
              <div className="space-y-1.5 pt-1 border-t border-[var(--border)]">
                {genSteps.map((step) => (
                  <div
                    key={step.id}
                    className={clsx(
                      'flex items-start gap-2 text-xs',
                      step.status === 'running' && 'text-accent'
                    )}
                  >
                    {step.status === 'pending' && <span className="text-[var(--muted)] mt-0.5">○</span>}
                    {step.status === 'running' && <span className="mt-0.5 animate-spin">⟳</span>}
                    {step.status === 'done' && <span className="text-emerald-400 mt-0.5">✓</span>}
                    {step.status === 'error' && <span className="text-red-400 mt-0.5">✗</span>}
                    <div className="min-w-0 flex-1">
                      <span className={step.status === 'pending' ? 'text-[var(--muted)]' : ''}>{step.label}</span>
                      {step.detail && (
                        <p className="text-[10px] text-[var(--muted)] truncate mt-0.5" title={step.detail}>
                          {step.detail}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Live: files generated (order they appear) */}
            {generatedFilePaths.length > 0 && (
              <div className="border-t border-[var(--border)] pt-2">
                <p className="text-[9px] uppercase tracking-wider text-accent mb-1.5 flex items-center gap-1">
                  <FileCode className="w-3 h-3" />
                  Files generated ({generatedFilePaths.length})
                </p>
                <ul className="max-h-24 overflow-y-auto scrollbar-thin space-y-0.5">
                  {generatedFilePaths.map((path, i) => (
                    <li key={path} className="text-[10px] font-mono text-[var(--muted)] truncate pl-1">
                      <span className="text-emerald-500/80">{i + 1}.</span> {path}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Live: code stream (last ~4k chars) */}
            {streamingContent.length > 0 && (
              <div className="border-t border-[var(--border)] pt-2">
                <p className="text-[9px] uppercase tracking-wider text-accent mb-1.5">Code stream (live)</p>
                <pre
                  ref={streamPreRef}
                  className="h-32 overflow-auto scrollbar-thin rounded bg-[var(--bg)] p-2 text-[10px] font-mono text-[var(--text)] whitespace-pre-wrap break-all border border-[var(--border)]"
                >
                  {streamingContent}
                  <span className="animate-pulse">▌</span>
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Section 4: Error */}
        {lastError && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-200 flex-1">{lastError}</p>
              <button
                type="button"
                onClick={() => clearError()}
                className="p-1 rounded text-red-400 hover:bg-red-500/20"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {lastParseFailureRaw != null && lastParseFailureRaw.length > 0 && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(lastParseFailureRaw!);
                    useUiStore.getState().showNotification('Raw response copied to clipboard.', 'success');
                  } catch {
                    useUiStore.getState().showNotification('Could not copy to clipboard.', 'error');
                  }
                }}
                className="flex items-center gap-1.5 text-[10px] text-red-300 hover:text-red-200"
              >
                <Copy className="w-3 h-3" />
                Copy raw response
              </button>
            )}
          </div>
        )}

        <div className="border-t border-[var(--border)] my-1" />

        {/* Section 6: Quick Starts */}
        <div>
          <p className="text-[9px] uppercase tracking-wider text-[var(--muted)] mb-2">
            Quick starts
          </p>
          <div className="grid gap-1.5">
            {EXAMPLE_PROMPTS.map((ex, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPrompt((p) => p + (p ? '\n\n' : '') + ex.label)}
                className="text-left px-3 py-2 rounded-lg border border-transparent hover:bg-[var(--faint)] hover:border-[var(--border)] text-xs text-[var(--text)] transition-colors"
              >
                <span className="mr-2">{ex.icon}</span>
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        {/* Section 7: History */}
        {history.length > 0 && (
          <div>
            <p className="text-[9px] uppercase tracking-wider text-[var(--muted)] mb-2">
              Recent builds
            </p>
            <ul className="space-y-2">
              {history.slice(0, 5).map((proj, i) => (
                <li key={proj.id}>
                  <button
                    type="button"
                    onClick={() => loadFromHistory(i)}
                    className="w-full text-left rounded-lg p-2 hover:bg-[var(--faint)] border border-transparent hover:border-[var(--border)] transition-colors"
                  >
                    <span className="text-[9px] text-accent">
                      {new Date(proj.createdAt).toLocaleString()}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <Tag variant="violet">{Object.keys(proj.files).length} files</Tag>
                    </div>
                    <p className="text-xs text-[var(--muted)] truncate mt-1">
                      {proj.description.slice(0, 40)}…
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Chat section hidden until backend is wired — Send had no handler */}
      </div>
    </aside>
  );
}
