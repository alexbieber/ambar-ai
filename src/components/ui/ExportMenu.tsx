import { useState, useRef, useEffect } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { useUiStore } from '../../stores/uiStore';
import {
  exportAsZip,
  copyProjectSummary,
  generateReadme,
} from '../../services/exportService';
import { Download, FileText, Copy, FileCode, BookOpen } from 'lucide-react';

export function ExportMenu() {
  const project = useProjectStore((s) => s.project);
  const showNotification = useUiStore((s) => s.showNotification);
  const setActiveRightTab = useUiStore((s) => s.setActiveRightTab);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onOutside);
    return () => window.removeEventListener('mousedown', onOutside);
  }, [open]);

  if (!project) return null;

  const safeZipName = (name: string) =>
    name.replace(/\s+/g, '-').replace(/[^\w.-]/g, '') || 'flutter-project';

  const handleZip = async () => {
    try {
      const blob = await exportAsZip(project);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeZipName(project.name)}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      showNotification('Project downloaded as ZIP', 'success');
      setOpen(false);
    } catch (e) {
      showNotification(e instanceof Error ? e.message : 'Export failed', 'error');
    }
  };

  const handleCopyPubspec = async () => {
    const f = project.files['pubspec.yaml'];
    if (f) {
      try {
        await navigator.clipboard.writeText(f.content);
        showNotification('pubspec.yaml copied', 'success');
      } catch {
        showNotification('Clipboard access denied or failed', 'error');
      }
    }
    setOpen(false);
  };

  const handleCopySummary = async () => {
    const text = copyProjectSummary(project);
    try {
      await navigator.clipboard.writeText(text);
      const count = Object.keys(project.files).length;
      showNotification(`${count} files copied (paste into your project)`, 'success');
    } catch {
      showNotification('Clipboard access denied or failed', 'error');
    }
    setOpen(false);
  };

  const handleDownloadReadme = () => {
    const readme = generateReadme(project);
    const blob = new Blob([readme], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'README.md';
    a.click();
    URL.revokeObjectURL(url);
    showNotification('README downloaded', 'success');
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="p-2 rounded text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--faint)] flex items-center gap-1 text-sm"
      >
        <Download className="w-4 h-4" />
        Export
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 py-1 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xl min-w-[200px] z-50">
          <button
            type="button"
            onClick={handleZip}
            className="w-full px-3 py-2 text-left text-sm text-[var(--text)] hover:bg-[var(--faint)] flex items-center gap-2"
          >
            <FileCode className="w-4 h-4" />
            Download as ZIP
          </button>
          <button
            type="button"
            onClick={handleCopyPubspec}
            className="w-full px-3 py-2 text-left text-sm text-[var(--text)] hover:bg-[var(--faint)] flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Copy pubspec.yaml
          </button>
          <button
            type="button"
            onClick={handleCopySummary}
            className="w-full px-3 py-2 text-left text-sm text-[var(--text)] hover:bg-[var(--faint)] flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Copy project summary
          </button>
          <button
            type="button"
            onClick={handleDownloadReadme}
            className="w-full px-3 py-2 text-left text-sm text-[var(--text)] hover:bg-[var(--faint)] flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Download README
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveRightTab('howto');
              setOpen(false);
            }}
            className="w-full px-3 py-2 text-left text-sm text-[var(--text)] hover:bg-[var(--faint)] flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            How to run
          </button>
          <div className="border-t border-[var(--border)] my-1" />
          <button
            type="button"
            disabled
            className="w-full px-3 py-2 text-left text-sm text-[var(--muted)] flex items-center gap-2 cursor-not-allowed"
          >
            Share project
            <span className="text-[9px] bg-[var(--faint)] px-1 rounded">Coming soon</span>
          </button>
        </div>
      )}
    </div>
  );
}
