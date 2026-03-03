import { clsx } from 'clsx';
import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  className?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={clsx(
          'w-full px-3 py-2 rounded-lg bg-[var(--panel)] border text-[var(--text)] font-mono text-sm',
          'placeholder:text-[var(--muted)]',
          'focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent',
          'transition-colors',
          error ? 'border-red-500' : 'border-[var(--border)]',
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
