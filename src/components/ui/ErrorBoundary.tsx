import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('FlutterForge ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[var(--bg)] text-[var(--text)]">
          <AlertTriangle className="w-16 h-16 text-amber-400 mb-4" />
          <h1 className="font-display font-bold text-xl mb-2">Something went wrong</h1>
          <p className="text-sm text-[var(--muted)] max-w-md text-center mb-4">
            {this.state.error.message}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 rounded-lg bg-accent/20 text-accent hover:bg-accent/30"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
