import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Wheat, RefreshCw, AlertTriangle } from 'lucide-react';
import { logClientError } from '../lib/errorLogging';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render errors anywhere in the tree below it so a bug in one page
 * shows a recoverable fallback instead of a blank white screen. Render
 * errors only — it can't catch errors in event handlers, async code, or
 * effects; those still need their own try/catch.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Unhandled render error:', error, info.componentStack);
    logClientError(error, { componentStack: info.componentStack });
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-farm-900 via-farm-800 to-earth-900 flex items-center justify-center px-4">
          <div className="w-full max-w-md text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-farm-500 mb-4 shadow-lg">
              <Wheat className="w-8 h-8 text-white" />
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Something went wrong</h1>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                FarmMap hit an unexpected error. Reloading usually fixes it — your data is safe either way.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="btn-primary w-full justify-center py-3 text-base mt-6"
              >
                <RefreshCw className="w-4 h-4" />
                Reload FarmMap
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
