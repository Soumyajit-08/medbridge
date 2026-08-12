import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/common/Button';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRefresh = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          className="flex min-h-[50vh] flex-col items-center justify-center px-4 py-12 text-center"
        >
          <div
            className="mb-4 flex size-14 items-center justify-center rounded-full bg-critical/10 text-critical"
            aria-hidden="true"
          >
            <AlertCircle className="size-7" />
          </div>

          <h1 className="text-xl font-semibold text-text-primary">Something went wrong</h1>
          <p className="mt-2 max-w-md text-sm text-text-secondary">
            We encountered an unexpected error. Refreshing the page usually fixes this.
          </p>

          {import.meta.env.DEV && this.state.error && (
            <pre className="mt-4 max-w-lg overflow-auto rounded-lg bg-background p-4 text-left text-xs text-critical">
              {this.state.error.message}
            </pre>
          )}

          <Button variant="primary" className="mt-6 gap-2" onClick={this.handleRefresh}>
            <RefreshCw className="size-4" aria-hidden="true" />
            Refresh page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
