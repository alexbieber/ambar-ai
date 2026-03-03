import { useEffect } from 'react';
import { useUiStore } from '../../stores/uiStore';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';

const AUTO_DISMISS: Record<string, number> = {
  success: 3000,
  info: 3000,
  warning: 5000,
  error: 8000,
};

export function NotificationStack() {
  const { notifications, dismissNotification } = useUiStore();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-[340px]">
      {(notifications.slice(0, 4) as typeof notifications).map((n) => (
        <NotificationItem key={n.id} notification={n} onDismiss={() => dismissNotification(n.id)} />
      ))}
    </div>
  );
}

function NotificationItem({
  notification,
  onDismiss,
}: {
  notification: { id: string; message: string; type: 'success' | 'error' | 'info' | 'warning' };
  onDismiss: () => void;
}) {
  useEffect(() => {
    const ms = AUTO_DISMISS[notification.type] ?? 3000;
    const t = setTimeout(onDismiss, ms);
    return () => clearTimeout(t);
  }, [notification.id, notification.type, onDismiss]);

  const Icon =
    notification.type === 'success'
      ? CheckCircle
      : notification.type === 'error'
        ? AlertCircle
        : notification.type === 'warning'
          ? AlertTriangle
          : Info;

  const borderClass =
    notification.type === 'success'
      ? 'border-emerald-500/50'
      : notification.type === 'error'
        ? 'border-red-500/50'
        : notification.type === 'warning'
          ? 'border-amber-500/50'
          : 'border-accent/50';

  const iconClass =
    notification.type === 'success'
      ? 'text-emerald-400'
      : notification.type === 'error'
        ? 'text-red-400'
        : notification.type === 'warning'
          ? 'text-amber-400'
          : 'text-accent';

  return (
    <div
      className={clsx(
        'flex items-start gap-3 p-3 rounded-lg bg-[var(--panel)] border shadow-lg animate-[slideInRight_0.2s_ease-out]',
        borderClass
      )}
    >
      <Icon className={clsx('w-4 h-4 flex-shrink-0 mt-0.5', iconClass)} />
      <p className="text-xs font-mono text-[var(--text)] flex-1">{notification.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="p-1 rounded text-[var(--muted)] hover:bg-[var(--faint)] hover:text-[var(--text)]"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
