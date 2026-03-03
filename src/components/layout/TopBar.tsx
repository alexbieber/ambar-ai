import { useState, useRef, useEffect } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { useAiStore } from '../../stores/aiStore';
import { useUiStore } from '../../stores/uiStore';
import { Tag } from '../ui/Tag';
import { Button } from '../ui/Button';
import { Settings, HelpCircle, Key } from 'lucide-react';
import { ExportMenu } from '../ui/ExportMenu';

export function TopBar() {
  const project = useProjectStore((s) => s.project);
  const setProject = useProjectStore((s) => s.setProject);
  const fileCount = useProjectStore((s) => (s.project ? Object.keys(s.project.files).length : 0));
  const totalLines = useProjectStore((s) => {
    if (!s.project) return 0;
    return Object.values(s.project.files).reduce(
      (n, f) => n + (f.content.split(/\n/).length || 1),
      0
    );
  });

  const isConnected = useAiStore((s) => s.isConnected);
  const provider = useAiStore((s) => s.provider);
  const effectiveProvider = useAiStore((s) => s.getEffectiveProvider());
  const effectiveModelId = useAiStore((s) => s.getEffectiveModelId());
  const setShowApiKeyModal = useUiStore((s) => s.setShowApiKeyModal);
  const setShowSettingsModal = useUiStore((s) => s.setShowSettingsModal);
  const setShowShortcutsModal = useUiStore((s) => s.setShowShortcutsModal);

  const [editingName, setEditingName] = useState(false);
  const [projectName, setProjectName] = useState(project?.name ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProjectName(project?.name ?? '');
  }, [project?.name]);

  useEffect(() => {
    if (editingName) inputRef.current?.focus();
  }, [editingName]);

  const saveProjectName = () => {
    setEditingName(false);
    if (project && projectName.trim()) {
      setProject({ ...project, name: projectName.trim() });
    }
  };

  return (
    <header className="h-[52px] flex-shrink-0 flex items-center justify-between px-4 bg-[var(--surface)]/90 backdrop-blur-sm border-b border-[var(--border)]">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-violet flex items-center justify-center text-white shadow-lg shadow-accent/20">
          ⚡
        </div>
        <div>
          <span className="font-display font-extrabold text-lg text-white">FlutterForge</span>
          <span className="ml-2 text-[9px] uppercase tracking-wider text-[var(--muted)]">
            AI App Builder
          </span>
        </div>
      </div>

      {project && (
        <div className="flex items-center gap-2 flex-1 justify-center min-w-0">
          {editingName ? (
            <input
              ref={inputRef}
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onBlur={saveProjectName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveProjectName();
                if (e.key === 'Escape') {
                  setEditingName(false);
                  setProjectName(project.name);
                }
              }}
              className="px-2 py-1 rounded bg-[var(--panel)] border border-[var(--border)] text-sm text-[var(--text)] font-mono focus:outline-none focus:ring-1 focus:ring-accent min-w-[120px]"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditingName(true)}
              className="font-display font-semibold text-sm text-white hover:text-accent truncate max-w-[200px]"
            >
              {project.name}
            </button>
          )}
          <span className="text-[var(--muted)]">·</span>
          <Tag variant="violet">{fileCount} files</Tag>
          <Tag variant="muted">{totalLines.toLocaleString()} lines</Tag>
        </div>
      )}

      <div className="flex items-center gap-2">
        {isConnected ? (
          <Tag variant="success" className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {provider === 'auto' ? `Auto (${effectiveProvider === 'anthropic' ? 'Claude' : 'Gemini'})` : effectiveProvider === 'anthropic' ? 'Claude' : 'Gemini'}
          </Tag>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowApiKeyModal(true)}
            className="flex items-center gap-1"
          >
            <Key className="w-3.5 h-3.5" />
            Add API Key
          </Button>
        )}
        <span title={effectiveModelId}>
          <Tag variant="muted">
            {effectiveModelId.replace(/^claude-|^gemini-/, '').slice(0, 20)}
          </Tag>
        </span>
        <ExportMenu />
        <button
          type="button"
          onClick={() => setShowSettingsModal(true)}
          className="p-2 rounded text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--faint)] focus-visible:ring-2 focus-visible:ring-accent"
          title="Settings (⌘,)"
        >
          <Settings className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setShowShortcutsModal(true)}
          className="p-2 rounded text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--faint)] focus-visible:ring-2 focus-visible:ring-accent"
          title="Keyboard shortcuts"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
