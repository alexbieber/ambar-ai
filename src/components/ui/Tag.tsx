import { clsx } from 'clsx';

interface TagProps {
  children: React.ReactNode;
  variant?: 'violet' | 'muted' | 'success';
  className?: string;
}

export function Tag({ children, variant = 'muted', className }: TagProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium',
        variant === 'violet' && 'bg-violet/20 text-violet border border-violet/30',
        variant === 'muted' && 'bg-[var(--faint)] text-[var(--muted)] border border-[var(--border)]',
        variant === 'success' && 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
        className
      )}
    >
      {children}
    </span>
  );
}
