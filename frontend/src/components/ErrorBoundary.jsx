import React, { Component } from 'react';
import { AlertOctagon, RotateCw } from 'lucide-react';

/**
 * ErrorBoundary catches runtime rendering crashes and prevents blank screen.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught unhandled error:', error, errorInfo);
  }

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
          <div className="h-16 w-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
            <AlertOctagon className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Something went wrong</h2>
          <p className="text-sm text-slate-500 max-w-sm mt-2 leading-relaxed">
            The application encountered an unexpected layout error. Try refreshing the page.
          </p>

          {/* Dev mode error details stack */}
          {process.env.NODE_ENV !== 'production' && this.state.error && (
            <pre className="mt-4 p-4 bg-slate-100 border border-slate-200 rounded-xl text-left text-[10px] font-mono text-red-600 max-w-md overflow-x-auto max-h-[150px] scrollbar-thin">
              {this.state.error.toString()}
            </pre>
          )}

          <button
            onClick={this.handleRefresh}
            type="button"
            className="mt-6 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-indigo-500/10 active:scale-95 transition-all focus:outline-none"
          >
            <RotateCw className="h-3.5 w-3.5" />
            <span>Refresh Page</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
