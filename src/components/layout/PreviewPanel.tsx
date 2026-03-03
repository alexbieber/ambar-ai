import { useState, useMemo, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useProjectStore } from '../../stores/projectStore';
import { useGenerate } from '../../hooks/useGenerate';
import { createPreviewBlobUrl } from '../../services/previewGenerator';
import { syncPreviewToServer, getPreviewUrl } from '../../services/previewSyncService';
import { Tag } from '../ui/Tag';
import { Spinner } from '../ui/Spinner';
import { RotateCw, Maximize2, Smartphone, Code, X } from 'lucide-react';
import { clsx } from 'clsx';
import type { PreviewSource } from '../../types';

type Device = 'iphone' | 'android' | 'tablet';

const PREVIEW_CONTENT_WIDTH = 390;
const PREVIEW_CONTENT_HEIGHT = 760;

const PREVIEW_FAILURE_PLACEHOLDER_HTML =
  '<!DOCTYPE html><html><body style="background:#0e0e1c;color:#888;font-family:monospace;padding:16px;">Preview could not be generated.</body></html>';

const DEVICE_STYLES: Record<Device, { width: number; height: number; contentHeightOffset: number; className: string }> = {
  iphone: {
    width: 245,
    height: 520,
    contentHeightOffset: 8,
    className:
      'rounded-[40px] border-[6px] border-[#1c1c2e] shadow-[0_0_0_1px_#2a2a45,0_28px_70px_rgba(0,0,0,0.85)]',
  },
  android: {
    width: 240,
    height: 520,
    contentHeightOffset: 0,
    className: 'rounded-[24px] border-2 border-[#0f0f0f] bg-[#0f0f0f]',
  },
  tablet: {
    width: 380,
    height: 280,
    contentHeightOffset: 0,
    className: 'rounded-xl border-4 border-[#1c1c2e]',
  },
};

export function PreviewPanel() {
  const project = useProjectStore((s) => s.project);
  const { regeneratePreview, regeneratePreviewFromCode, isGenerating } = useGenerate();
  const [device, setDevice] = useState<Device>('iphone');
  const [fullscreen, setFullscreen] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [mobilePreviewUrl, setMobilePreviewUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);

  const blobUrl = useMemo(() => {
    if (!project?.previewHtml) return null;
    return createPreviewBlobUrl(project.previewHtml);
  }, [project?.previewHtml]);

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  useEffect(() => {
    if (!fullscreen && !showQR) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFullscreen(false);
        setShowQR(false);
        setQrError(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen, showQR]);

  const handleOpenOnPhone = async () => {
    if (!project?.previewHtml?.trim()) return;
    setQrError(null);
    setShowQR(true);
    setMobilePreviewUrl(null);
    try {
      await syncPreviewToServer(project.previewHtml);
      const url = await getPreviewUrl();
      setMobilePreviewUrl(url);
    } catch (e) {
      setQrError(e instanceof Error ? e.message : 'Could not get preview URL. Is the server running (npm run dev:full)?');
    }
  };

  const style = DEVICE_STYLES[device];
  const contentH = style.height - style.contentHeightOffset;
  const scale = Math.min(style.width / PREVIEW_CONTENT_WIDTH, contentH / PREVIEW_CONTENT_HEIGHT);
  const scaledW = Math.round(PREVIEW_CONTENT_WIDTH * scale);
  const scaledH = Math.round(PREVIEW_CONTENT_HEIGHT * scale);
  const hasContent = Boolean(project?.previewHtml?.trim());
  const isPlaceholderFailure =
    project?.previewHtml?.trim() === PREVIEW_FAILURE_PLACEHOLDER_HTML.trim();
  const previewSource: PreviewSource | undefined = project?.previewSource;
  const fileCount = project ? Object.keys(project.files).length : 0;
  const totalLines = project
    ? Object.values(project.files).reduce((n, f) => n + (f.content.split(/\n/).length || 1), 0)
    : 0;

  return (
    <>
    <div className="h-full flex flex-col bg-[var(--panel)] border-l border-[var(--border)] overflow-hidden">
      <div className="px-3 py-2 border-b border-[var(--border)] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[9px] uppercase tracking-wider text-[var(--muted)]">Live Preview</span>
          {previewSource && (
            <Tag variant="muted" className="text-[9px]">
              {previewSource === 'code' ? 'From code' : 'From description'}
            </Tag>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => regeneratePreview()}
            disabled={!project || isGenerating}
            className="p-1.5 rounded text-[var(--muted)] hover:text-accent hover:bg-[var(--faint)] disabled:opacity-50"
            title="Regenerate from description"
          >
            <RotateCw className={clsx('w-4 h-4', isGenerating && 'animate-spin')} />
          </button>
          <button
            type="button"
            onClick={() => regeneratePreviewFromCode()}
            disabled={!project || isGenerating}
            className="p-1.5 rounded text-[var(--muted)] hover:text-accent hover:bg-[var(--faint)] disabled:opacity-50"
            title="Preview from current code"
          >
            <Code className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setFullscreen(true)}
            className="p-1.5 rounded text-[var(--muted)] hover:text-accent hover:bg-[var(--faint)]"
            title="Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleOpenOnPhone}
            disabled={!project?.previewHtml?.trim() || isPlaceholderFailure}
            className="p-1.5 rounded text-[var(--muted)] hover:text-accent hover:bg-[var(--faint)] disabled:opacity-50"
            title="Open on phone (scan QR)"
          >
            <Smartphone className="w-4 h-4" />
          </button>
          <div className="flex rounded overflow-hidden border border-[var(--border)]">
            {(['iphone', 'android', 'tablet'] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDevice(d)}
                className={clsx(
                  'px-2 py-1 text-[9px] uppercase',
                  device === d ? 'bg-accent/20 text-accent' : 'text-[var(--muted)] hover:bg-[var(--faint)]'
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto flex flex-col items-center justify-center p-4 min-h-0">
        <div
          className={clsx(
            'overflow-hidden bg-[#0a0a0a] flex flex-col transition-shadow duration-300',
            style.className,
            hasContent && 'shadow-[0_0_30px_rgba(0,240,255,0.2),0_28px_70px_rgba(0,0,0,0.85)]'
          )}
          style={{ width: style.width, height: style.height }}
        >
            {device === 'iphone' && (
              <div className="h-6 flex-shrink-0 flex items-center justify-center bg-[#1c1c2e]">
                <div className="w-12 h-3 rounded-full bg-black" />
              </div>
            )}
            <div className="flex-1 min-h-0 relative flex items-center justify-center overflow-hidden bg-[#121212]">
              {!project && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                  <Smartphone className="w-12 h-12 text-[var(--faint)] mb-2" />
                  <p className="text-[10px] text-[var(--faint)]">Preview will appear here.</p>
                </div>
              )}
              {project && !hasContent && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                  <Spinner className="text-accent mb-2" />
                  <p className="text-[10px] text-[var(--muted)] animate-pulse">Rendering preview…</p>
                </div>
              )}
              {project && hasContent && isPlaceholderFailure && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 gap-3">
                  <p className="text-[10px] text-[var(--muted)]">Preview could not be generated.</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <button
                      type="button"
                      onClick={() => regeneratePreview()}
                      disabled={isGenerating}
                      className="px-3 py-1.5 rounded-lg bg-accent/20 text-accent text-xs font-medium hover:bg-accent/30 disabled:opacity-50"
                    >
                      {isGenerating ? '…' : 'Retry'}
                    </button>
                    <button
                      type="button"
                      onClick={() => regeneratePreviewFromCode()}
                      disabled={isGenerating}
                      className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text)] text-xs hover:bg-[var(--faint)] disabled:opacity-50"
                    >
                      Preview from code
                    </button>
                  </div>
                </div>
              )}
              {project && hasContent && !isPlaceholderFailure && blobUrl && (
                <div
                  className="flex items-center justify-center overflow-hidden"
                  style={{ width: style.width, height: contentH }}
                >
                  <div style={{ width: scaledW, height: scaledH }} className="overflow-hidden shrink-0">
                    <iframe
                      key={blobUrl}
                      src={blobUrl}
                      title="Preview"
                      sandbox="allow-scripts"
                      className="border-0 bg-white block"
                      style={{
                        width: PREVIEW_CONTENT_WIDTH,
                        height: PREVIEW_CONTENT_HEIGHT,
                        transform: `scale(${scale})`,
                        transformOrigin: '0 0',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            {device === 'iphone' && (
              <div className="h-2 flex-shrink-0 flex items-center justify-center">
                <div className="w-[68px] h-1 rounded-full bg-[var(--muted)]" />
              </div>
            )}
        </div>

        {project && (
          <div className="flex items-center gap-2 mt-3 flex-wrap justify-center">
            <Tag variant="violet">{fileCount} files</Tag>
            <Tag variant="muted">{totalLines} lines</Tag>
            <span className="text-[9px] text-[var(--faint)]">Flutter · Dart</span>
          </div>
        )}
      </div>

      {showQR && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
          onClick={() => { setShowQR(false); setQrError(null); }}
          role="dialog"
          aria-modal
        >
          <div
            className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 max-w-sm shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-[var(--text)]">Open on phone</span>
              <button
                type="button"
                onClick={() => { setShowQR(false); setQrError(null); }}
                className="p-1.5 rounded text-[var(--muted)] hover:bg-[var(--faint)] hover:text-[var(--text)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[var(--muted)] mb-3">Scan with your phone camera (same Wi‑Fi as this computer).</p>
            {qrError && (
              <p className="text-xs text-red-400 mb-3">{qrError}</p>
            )}
            {mobilePreviewUrl && (
              <>
                <div className="flex justify-center p-4 bg-white rounded-lg">
                  <QRCodeSVG value={mobilePreviewUrl} size={200} level="M" />
                </div>
                <p className="mt-3 text-[10px] text-[var(--muted)] break-all font-mono">{mobilePreviewUrl}</p>
              </>
            )}
            {!mobilePreviewUrl && !qrError && (
              <div className="flex justify-center py-8">
                <Spinner className="text-accent" />
              </div>
            )}
          </div>
        </div>
      )}

      {fullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
          onClick={() => setFullscreen(false)}
          role="dialog"
          aria-modal
        >
          <div
            className="origin-center flex items-center justify-center"
            style={{ transform: 'scale(1.3)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={clsx('overflow-hidden bg-[#121212] flex flex-col', style.className)}
              style={{ width: style.width, height: style.height }}
            >
              {device === 'iphone' && (
                <div className="h-6 flex-shrink-0 flex items-center justify-center bg-[#1c1c2e]">
                  <div className="w-12 h-3 rounded-full bg-black" />
                </div>
              )}
              {project?.previewHtml && blobUrl && (
                <div
                  className="flex-1 min-h-0 flex items-center justify-center overflow-hidden"
                  style={{ height: contentH }}
                >
                  <div style={{ width: scaledW, height: scaledH }} className="overflow-hidden shrink-0">
                    <iframe
                      key={blobUrl}
                      src={blobUrl}
                      title="Preview fullscreen"
                      sandbox="allow-scripts"
                      className="border-0 bg-white block"
                      style={{
                        width: PREVIEW_CONTENT_WIDTH,
                        height: PREVIEW_CONTENT_HEIGHT,
                        transform: `scale(${scale})`,
                        transformOrigin: '0 0',
                      }}
                    />
                  </div>
                </div>
              )}
              {device === 'iphone' && (
                <div className="h-2 flex-shrink-0 flex items-center justify-center">
                  <div className="w-[68px] h-1 rounded-full bg-[var(--muted)]" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
