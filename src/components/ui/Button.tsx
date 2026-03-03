import { clsx } from 'clsx';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        className={clsx(
          'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-[var(--bg)] disabled:opacity-50 disabled:pointer-events-none',
          size === 'sm' && 'px-2.5 py-1.5 text-xs',
          size === 'md' && 'px-4 py-2 text-sm',
          size === 'lg' && 'px-5 py-2.5 text-base',
          variant === 'primary' && 'bg-[var(--panel)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--faint)]',
          variant === 'secondary' && 'bg-[var(--faint)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--border)]',
          variant === 'ghost' && 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--faint)]',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
