import { useCallback } from 'react';
import { useAiStore } from '../../stores/aiStore';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { FileExplorer } from './FileExplorer';
import { EditorPanel } from './EditorPanel';
import { PreviewPanel } from './PreviewPanel';
import { useUiStore } from '../../stores/uiStore';
import { LayoutDashboard, FolderTree, Smartphone } from 'lucide-react';
import { clsx } from 'clsx';

const MIN_SIDEBAR = 180;
const MAX_SIDEBAR = 400;
const MIN_EXPLORER = 150;
const MAX_EXPLORER = 350;
const MIN_PREVIEW = 240;
const MAX_PREVIEW = 500;
const COLLAPSED_WIDTH = 28;

function ResizeHandle({
  onDrag,
  axis = 'horizontal',
  className,
}: {
  onDrag: (delta: number) => void;
  axis?: 'horizontal' | 'vertical';
  className?: string;
}) {
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      let startX = e.clientX;
      let startY = e.clientY;
      const onMove = (ev: MouseEvent) => {
        const delta = axis === 'horizontal' ? ev.clientX - startX : ev.clientY - startY;
        startX = ev.clientX;
        startY = ev.clientY;
        onDrag(delta);
      };
      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
      document.body.style.cursor = axis === 'horizontal' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [axis, onDrag]
  );

  return (
    <div
      role="separator"
      aria-orientation={axis}
      className={clsx(
        'flex-shrink-0 w-1 bg-[var(--border)] hover:bg-accent/50 transition-colors cursor-col-resize',
        className
      )}
      onMouseDown={onMouseDown}
    />
  );
}

export function IDELayout() {
  const progress = useAiStore((s) => s.progress);
  const isGenerating = useAiStore((s) => s.isLoading);
  const {
    sidebarWidth,
    explorerWidth,
    previewWidth,
    showPreview,
    showExplorer,
    setSidebarWidth,
    setExplorerWidth,
    setPreviewWidth,
  } = useUiStore();

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
  const sidebarCollapsed = sidebarWidth <= 40;
  const explorerCollapsed = explorerWidth <= 40;
  const previewCollapsed = previewWidth <= 40;

  return (
    <div className="grid h-screen w-full bg-[var(--bg)]" style={{ gridTemplateRows: '52px 2px 1fr' }}>
      <TopBar />
      <div className="bg-[var(--border)] overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-violet to-accent transition-[width] duration-300"
          style={{ width: isGenerating ? `${progress}%` : '0%' }}
        />
      </div>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Sidebar */}
        <div
          className="flex-shrink-0 flex flex-col border-r border-[var(--border)] overflow-hidden transition-[width] duration-200"
          style={{
            width: sidebarCollapsed ? COLLAPSED_WIDTH : sidebarWidth,
            minWidth: sidebarCollapsed ? COLLAPSED_WIDTH : sidebarWidth,
          }}
        >
          {sidebarCollapsed ? (
            <div className="w-full h-full flex flex-col items-center py-2 bg-[var(--panel)]">
              <button
                type="button"
                onClick={() => setSidebarWidth(260)}
                className="p-1.5 rounded text-[var(--muted)] hover:text-accent hover:bg-[var(--faint)]"
                title="Expand sidebar (⌘B)"
              >
                <LayoutDashboard className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Sidebar />
          )}
        </div>
        {!sidebarCollapsed && (
          <ResizeHandle
            onDrag={(d) => setSidebarWidth(clamp(sidebarWidth + d, MIN_SIDEBAR, MAX_SIDEBAR))}
          />
        )}

        {/* Explorer */}
        {showExplorer && (
          <>
            <div
              className="flex-shrink-0 flex flex-col overflow-hidden transition-[width] duration-200 border-r border-[var(--border)]"
              style={{
                width: explorerCollapsed ? COLLAPSED_WIDTH : explorerWidth,
                minWidth: explorerCollapsed ? COLLAPSED_WIDTH : explorerWidth,
              }}
            >
              {explorerCollapsed ? (
                <div className="w-full h-full flex flex-col items-center py-2 bg-[var(--panel)]">
                  <button
                    type="button"
                    onClick={() => setExplorerWidth(220)}
                    className="p-1.5 rounded text-[var(--muted)] hover:text-accent hover:bg-[var(--faint)]"
                    title="Expand explorer (⌘E)"
                  >
                    <FolderTree className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <FileExplorer />
              )}
            </div>
            {!explorerCollapsed && (
              <ResizeHandle
                onDrag={(d) => setExplorerWidth(clamp(explorerWidth + d, MIN_EXPLORER, MAX_EXPLORER))}
              />
            )}
          </>
        )}

        {/* Editor */}
        <div className="flex-1 min-w-0 flex flex-col">
          <EditorPanel />
        </div>

        {/* Preview */}
        {showPreview && (
          <>
            <div
              className="flex-shrink-0 flex flex-col overflow-hidden transition-[width] duration-200 border-l border-[var(--border)]"
              style={{
                width: previewCollapsed ? COLLAPSED_WIDTH : previewWidth,
                minWidth: previewCollapsed ? COLLAPSED_WIDTH : previewWidth,
              }}
            >
              {previewCollapsed ? (
                <div className="w-full h-full flex flex-col items-center py-2 bg-[var(--panel)]">
                  <button
                    type="button"
                    onClick={() => setPreviewWidth(320)}
                    className="p-1.5 rounded text-[var(--muted)] hover:text-accent hover:bg-[var(--faint)]"
                    title="Expand preview (⌘P)"
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <PreviewPanel />
              )}
            </div>
            {!previewCollapsed && (
              <ResizeHandle
                onDrag={(d) => setPreviewWidth(clamp(previewWidth + d, MIN_PREVIEW, MAX_PREVIEW))}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
