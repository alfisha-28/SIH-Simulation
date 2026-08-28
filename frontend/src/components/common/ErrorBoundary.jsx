import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled Application Error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-slate-900 border border-red-900/60 rounded-2xl p-8 shadow-2xl space-y-6 text-center">
            <div className="w-14 h-14 bg-red-950/80 border border-red-800 rounded-full flex items-center justify-center mx-auto text-2xl">
              ⚠️
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold font-mono uppercase tracking-wider text-red-400">
                Weather Command Center Error
              </h1>
              <p className="text-xs font-mono text-slate-400">
                An unhandled application exception occurred during rendering.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-left font-mono text-xs text-red-300 overflow-x-auto max-h-32">
              {this.state.error?.message || 'Unknown runtime error'}
            </div>

            <div className="pt-2 flex justify-center gap-4">
              <button
                onClick={this.handleReset}
                className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-lg shadow-cyan-600/30"
              >
                Return to Landing Overview
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
