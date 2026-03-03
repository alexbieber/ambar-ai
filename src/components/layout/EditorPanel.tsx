import { useCallback, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useProjectStore } from '../../stores/projectStore';
import { useUiStore } from '../../stores/uiStore';
import { useGenerate } from '../../hooks/useGenerate';
import { getFileIcon } from '../../utils/fileIcons';
import { getLanguageForPath } from '../../utils/syntaxColors';
import { Button } from '../ui/Button';
import { Copy, BookOpen, Code, X, Send } from 'lucide-react';
import { clsx } from 'clsx';

const FLUTTERFORGE_THEME = {
  base: 'vs-dark' as const,
  inherit: true,
  rules: [
    { token: 'keyword', foreground: 'f472b6' },
    { token: 'string', foreground: '00ffaa' },
    { token: 'comment', foreground: '4a5568' },
    { token: 'type', foreground: 'a78bfa' },
    { token: 'number', foreground: 'fbbf24' },
    { token: 'function', foreground: '00f0ff' },
  ],
  colors: {
    'editor.background': '#0e0e1c',
    'editor.foreground': '#c4c4e0',
    'editorLineNumber.foreground': '#1c1c30',
    'editorLineNumber.activeForeground': '#4a4a72',
    'editor.selectionBackground': '#00f0ff26',
    'editor.lineHighlightBackground': '#ffffff05',
    'editorCursor.foreground': '#00f0ff',
    'editor.selectionHighlightBackground': '#00f0ff14',
  },
};

function HowToRunContent() {
  return (
    <div className="p-6 space-y-4 max-w-lg">
      <h3 className="font-display font-bold text-lg text-[var(--text)]">How to run your project</h3>
      <ol className="space-y-3 text-sm text-[var(--muted)]">
        <li className="flex gap-3">
          <span className="text-accent font-mono font-bold">01</span>
          <span><code className="bg-[var(--faint)] px-1 rounded">flutter create my_app</code></span>
        </li>
        <li className="flex gap-3">
          <span className="text-accent font-mono font-bold">02</span>
          <span>Replace <code className="bg-[var(--faint)] px-1 rounded">lib/</code> folder contents with generated files.</span>
        </li>
        <li className="flex gap-3">
          <span className="text-accent font-mono font-bold">03</span>
          <span>Copy <code className="bg-[var(--faint)] px-1 rounded">pubspec.yaml</code> to project root.</span>
        </li>
        <li className="flex gap-3">
          <span className="text-accent font-mono font-bold">04</span>
          <span><code className="bg-[var(--faint)] px-1 rounded">cd my_app && flutter run</code></span>
        </li>
      </ol>
      <div className="rounded-lg bg-[var(--faint)] border border-[var(--border)] p-3 text-xs text-[var(--muted)]">
        Tip: See <a href="https://flutter.dev" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">flutter.dev</a> for full docs.
      </div>
    </div>
  );
}

export function EditorPanel() {
  const project = useProjectStore((s) => s.project);
  const activeFilePath = useProjectStore((s) => s.activeFilePath);
  const openTabs = useProjectStore((s) => s.openTabs);
  const setActiveFile = useProjectStore((s) => s.setActiveFile);
  const closeTab = useProjectStore((s) => s.closeTab);
  const updateFileContent = useProjectStore((s) => s.updateFileContent);

  const activeRightTab = useUiStore((s) => s.activeRightTab);
  const setActiveRightTab = useUiStore((s) => s.setActiveRightTab);
  const showNotification = useUiStore((s) => s.showNotification);

  const [editMode, setEditMode] = useState(false);
  const [editInstruction, setEditInstruction] = useState('');

  const { editFile, isGenerating } = useGenerate();

  const activeFile = project && activeFilePath ? project.files[activeFilePath] : null;

  const handleEditorMount = useCallback((_editor: unknown, monaco: typeof import('monaco-editor')) => {
    monaco.editor.defineTheme('flutterforge-dark', FLUTTERFORGE_THEME);
    monaco.editor.setTheme('flutterforge-dark');
  }, []);

  const handleCopyFile = async () => {
    if (!activeFile) return;
    try {
      await navigator.clipboard.writeText(activeFile.content);
      showNotification('Copied to clipboard', 'success');
    } catch {
      showNotification('Clipboard access denied or failed', 'error');
    }
  };

  const handleCopyAll = async () => {
    if (!project) return;
    const text = Object.entries(project.files)
      .map(([path, f]) => `// ${path}\n${f.content}`)
      .join('\n\n');
    try {
      await navigator.clipboard.writeText(text);
      showNotification('All files copied', 'success');
    } catch {
      showNotification('Clipboard access denied or failed', 'error');
    }
  };

  const handleEditSubmit = () => {
    if (!activeFilePath || !editInstruction.trim()) return;
    editFile(activeFilePath, editInstruction);
    setEditInstruction('');
    setEditMode(false);
  };

  if (!project) {
    return (
      <div className="h-full flex flex-col bg-[var(--surface)] overflow-hidden">
        <div className="px-3 py-2 border-b border-[var(--border)]">
          <span className="text-[9px] uppercase tracking-wider text-[var(--muted)]">Editor</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <Code className="w-16 h-16 text-[var(--faint)] mb-4" />
          <h3 className="font-display font-semibold text-lg text-[var(--text)] mb-2">Select a file to edit</h3>
          <p className="text-sm text-[var(--muted)] mb-4">Generate a project or click a file in the explorer.</p>
          <div className="flex gap-2">
            <span className="px-2 py-1 rounded text-xs bg-[var(--faint)] text-[var(--muted)]">Multi-file</span>
            <span className="px-2 py-1 rounded text-xs bg-[var(--faint)] text-[var(--muted)]">Material 3</span>
            <span className="px-2 py-1 rounded text-xs bg-[var(--faint)] text-[var(--muted)]">Real Dart</span>
          </div>
        </div>
      </div>
    );
  }

  if (activeRightTab === 'howto') {
    return (
      <div className="h-full flex flex-col bg-[var(--surface)] overflow-hidden">
        <div className="px-3 py-2 border-b border-[var(--border)] flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-wider text-[var(--muted)]">How to Run</span>
          <button
            type="button"
            onClick={() => setActiveRightTab('code')}
            className="p-1.5 rounded text-[var(--muted)] hover:bg-[var(--faint)] hover:text-[var(--text)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          <HowToRunContent />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[var(--surface)] overflow-hidden">
      {/* Tabs */}
      <div className="flex items-center border-b border-[var(--border)] bg-[var(--surface)] min-h-[38px] flex-shrink-0">
        <div className="flex-1 flex items-center overflow-x-auto scrollbar-thin">
          {openTabs.map((path) => {
            const file = project.files[path];
            const isActive = path === activeFilePath;
            const { icon, color } = getFileIcon(path);
            const name = path.split('/').pop() ?? path;
            return (
              <div
                key={path}
                className={clsx(
                  'flex items-center gap-2 pl-3 pr-2 py-2 border-b-2 min-w-0 max-w-[180px] cursor-pointer group',
                  isActive
                    ? 'bg-accent/10 border-accent text-accent'
                    : 'border-transparent hover:bg-[var(--faint)] text-[var(--text)]'
                )}
                onClick={() => setActiveFile(path)}
                onAuxClick={(e) => e.button === 1 && closeTab(path)}
              >
                <span className="text-xs flex-shrink-0" style={{ color }}>
                  {icon}
                </span>
                <span className="truncate text-xs">{name}</span>
                {file?.isDirty && (
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(path);
                  }}
                  className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-[var(--border)] flex-shrink-0"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-1 pr-2 border-l border-[var(--border)] pl-2">
          <button
            type="button"
            onClick={() => setActiveRightTab('howto')}
            className="p-2 rounded text-[var(--muted)] hover:bg-[var(--faint)] hover:text-[var(--text)] text-xs flex items-center gap-1"
          >
            <BookOpen className="w-4 h-4" />
            How to Run
          </button>
          <button
            type="button"
            onClick={handleCopyFile}
            className="p-2 rounded text-[var(--muted)] hover:bg-[var(--faint)] hover:text-[var(--text)]"
            title="Copy file"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleCopyAll}
            className="p-2 rounded text-[var(--muted)] hover:bg-[var(--faint)] hover:text-[var(--text)]"
            title="Copy all"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setEditMode((e) => !e)}
            className={clsx(
              'p-2 rounded text-xs flex items-center gap-1',
              editMode ? 'bg-accent/20 text-accent' : 'text-[var(--muted)] hover:bg-[var(--faint)] hover:text-[var(--text)]'
            )}
          >
            <Code className="w-4 h-4" />
            Edit
          </button>
        </div>
      </div>

      {/* Edit bar */}
      {editMode && (
        <div className="flex items-center gap-2 px-3 py-2 bg-[var(--panel)] border-b border-[var(--border)]">
          <input
            type="text"
            value={editInstruction}
            onChange={(e) => setEditInstruction(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setEditMode(false);
              if (e.key === 'Enter') handleEditSubmit();
            }}
            placeholder="Describe what to change in this file…"
            className="flex-1 px-3 py-2 rounded bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <Button
            onClick={handleEditSubmit}
            disabled={!editInstruction.trim() || isGenerating}
            className="bg-gradient-to-r from-accent to-violet text-[var(--bg)]"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Monaco */}
      {activeFile ? (
        <div className="flex-1 min-h-0 opacity-100 transition-opacity duration-150">
          <Editor
            height="100%"
            language={getLanguageForPath(activeFile.path)}
            value={activeFile.content}
            onChange={(value) => value != null && updateFileContent(activeFile.path, value)}
            onMount={handleEditorMount}
            theme="flutterforge-dark"
            options={{
              fontSize: 13,
              fontFamily: "'DM Mono', 'Fira Code', monospace",
              fontLigatures: true,
              lineHeight: 22,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              padding: { top: 16, bottom: 16 },
              renderLineHighlight: 'line',
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              bracketPairColorization: { enabled: true },
              formatOnPaste: true,
              suggest: { showWords: false },
            }}
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-[var(--muted)] text-sm">
          Select a file
        </div>
      )}
    </div>
  );
}
