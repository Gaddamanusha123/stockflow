import React from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('StockFlow UI Exception caught by ErrorBoundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  handleClearSession = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center text-white">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-4 border border-rose-500/30">
            <AlertOctagon className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Application Interface Encountered an Issue</h2>
          <p className="text-sm text-slate-400 mt-2 max-w-md">
            An unexpected error occurred while rendering the workspace. Don't worry, your database records remain completely safe.
          </p>
          {this.state.error && (
            <div className="mt-4 p-4 bg-slate-800 border border-slate-700 rounded-xl text-left max-w-xl w-full text-xs font-mono text-rose-300 overflow-x-auto">
              <p className="font-bold text-rose-400 mb-1">{this.state.error.toString()}</p>
              <pre className="text-[10px] text-slate-400 whitespace-pre-wrap">{this.state.error.stack}</pre>
            </div>
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Reload Workspace
            </button>
            <button
              onClick={this.handleClearSession}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold shadow-md transition-all"
            >
              Reset Session & Sign In
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

