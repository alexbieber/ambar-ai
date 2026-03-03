import { useState, useCallback } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { useAiStore } from '../../stores/aiStore';
import { useUiStore } from '../../stores/uiStore';
import { buildFileTree } from '../../services/fileParser';
import { getFileIcon } from '../../utils/fileIcons';
import { Tag } from '../ui/Tag';
import type { FileNode } from '../../types';
import { Folder, FolderOpen, Copy, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

function FileTreeNode({
  node,
  depth,
  activeFile,
  onSelect,
  onContextMenu,
  isSearchMatch,
}: {
  node: FileNode;
  depth: number;
  activeFile: string | null;
  onSelect: (path: string) => void;
  onContextMenu: (e: React.MouseEvent, path: string) => void;
  isSearchMatch?: (path: string) => boolean;
}) {
  const [open, setOpen] = useState(depth === 0 || node.path.startsWith('lib/'));
  const match = isSearchMatch?.(node.path) ?? true;

  if (node.type === 'folder') {
    const hasMatch =
      isSearchMatch &&
      (node.children ?? []).some((c) => c.path && (isSearchMatch(c.path) || c.type === 'folder'));
    return (
      <div className={clsx(!match && !hasMatch && 'hidden')}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center gap-1.5 py-1 px-2 rounded text-left text-sm hover:bg-[var(--faint)]"
          style={{ paddingLeft: 8 + depth * 14 }}
        >
          {open ? (
            <ChevronDown className="w-4 h-4 text-[var(--muted)] flex-shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-[var(--muted)] flex-shrink-0" />
          )}
          <FolderOpen className={clsx('w-4 h-4 text-amber-500/80 flex-shrink-0', !open && 'hidden')} />
          <Folder className={clsx('w-4 h-4 text-amber-500/80 flex-shrink-0', open && 'hidden')} />
          <span className="truncate text-[var(--text)]">{node.name}</span>
        </button>
        {open && node.children && (
          <div>
            {node.children.map((child) => (
              <FileTreeNode
                key={child.path}
                node={child}
                depth={depth + 1}
                activeFile={activeFile}
                onSelect={onSelect}
                onContextMenu={onContextMenu}
                isSearchMatch={isSearchMatch}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const { icon, color } = getFileIcon(node.path);
  const isActive = activeFile === node.path;
  const isDirty = useProjectStore((s) =>
    s.project?.files[node.path]?.isDirty ?? false
  );
  const lineCount = useProjectStore((s) => {
    const f = s.project?.files[node.path];
    return f ? (f.content.split(/\n/).length || 1) : 0;
  });

  if (!match) return null;

  return (
    <button
      type="button"
      onClick={() => onSelect(node.path)}
      onContextMenu={(e) => onContextMenu(e, node.path)}
      className={clsx(
        'w-full flex items-center gap-2 py-1 px-2 rounded text-left text-sm group',
        isActive
          ? 'bg-accent/10 border-l-2 border-accent text-accent'
          : 'hover:bg-[var(--faint)] border-l-2 border-transparent',
        'border-l-2'
      )}
      style={{ paddingLeft: 8 + depth * 14 }}
    >
      <span className="flex-shrink-0 text-xs" style={{ color }}>
        {icon}
      </span>
      <span className="truncate flex-1 text-[var(--text)]">{node.name}</span>
      {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" title="Modified" />}
      <span className="text-[9px] text-[var(--muted)] opacity-0 group-hover:opacity-100 flex-shrink-0">
        {lineCount}
      </span>
    </button>
  );
}

export function FileExplorer() {
  const project = useProjectStore((s) => s.project);
  const activeFile = useProjectStore((s) => s.activeFilePath);
  const setActiveFile = useProjectStore((s) => s.setActiveFile);
  const isLoading = useAiStore((s) => s.isLoading);
  const [search, setSearch] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; path: string } | null>(null);

  const tree = project ? buildFileTree(project.files) : [];
  const fileCount = project ? Object.keys(project.files).length : 0;

  const searchLower = search.trim().toLowerCase();
  const isSearchMatch = useCallback(
    (path: string) => !searchLower || path.toLowerCase().includes(searchLower),
    [searchLower]
  );

  const handleCopyAll = () => {
    if (!project) return;
    const text = Object.entries(project.files)
      .map(([path, f]) => `// ${path}\n${f.content}`)
      .join('\n\n');
    navigator.clipboard.writeText(text);
    useUiStore.getState().showNotification('All files copied to clipboard', 'success');
  };

  const handleContextMenu = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, path });
  };

  return (
    <div className="h-full flex flex-col bg-[var(--panel)] border-r border-[var(--border)] overflow-hidden">
      <div className="px-3 py-2 border-b border-[var(--border)] flex items-center justify-between gap-2 flex-wrap">
        <span className="text-[9px] uppercase tracking-wider text-[var(--muted)]">Explorer</span>
        <div className="flex items-center gap-1">
          <Tag variant="violet">{fileCount} files</Tag>
          <button
            type="button"
            onClick={handleCopyAll}
            className="p-1.5 rounded text-[var(--muted)] hover:text-accent hover:bg-[var(--faint)]"
            title="Copy all files"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="p-1.5 rounded text-[var(--muted)] hover:text-accent hover:bg-[var(--faint)]"
            title="New file (coming soon)"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="p-4 flex flex-col gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-5 rounded bg-[var(--faint)] animate-pulse"
              style={{ width: `${60 + Math.random() * 30}%` }}
            />
          ))}
        </div>
      )}

      {!project && !isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <Folder className="w-12 h-12 text-[var(--faint)] mb-2" />
          <p className="text-[10px] text-[var(--faint)]">Generate a project to see files here.</p>
        </div>
      )}

      {project && !isLoading && (
        <>
          <div className="px-2 py-1 border-b border-[var(--border)]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search files…"
              className="w-full px-2 py-1.5 rounded bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {tree.map((node) => (
              <FileTreeNode
                key={node.path}
                node={node}
                depth={0}
                activeFile={activeFile}
                onSelect={setActiveFile}
                onContextMenu={handleContextMenu}
                isSearchMatch={searchLower ? isSearchMatch : undefined}
              />
            ))}
          </div>
        </>
      )}

      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
            onContextMenu={(e) => e.preventDefault()}
          />
          <div
            className="fixed z-50 py-1 rounded-lg bg-[var(--panel)] border border-[var(--border)] shadow-xl min-w-[140px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              type="button"
              className="w-full px-3 py-2 text-left text-xs text-[var(--text)] hover:bg-[var(--faint)]"
              onClick={() => {
                navigator.clipboard.writeText(contextMenu.path);
                setContextMenu(null);
              }}
            >
              Copy path
            </button>
          </div>
        </>
      )}
    </div>
  );
}

