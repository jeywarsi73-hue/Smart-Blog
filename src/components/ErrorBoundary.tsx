import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'An unexpected error occurred.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FBF9F5] text-[#1C1917] flex items-center justify-center p-6">
          <div className="max-w-lg w-full border border-stone-200 bg-white p-8">
            <p className="text-xs uppercase tracking-widest text-[#9A3412] font-medium mb-2">
              Application Notice
            </p>
            <h1 className="font-editorial text-2xl font-semibold mb-3">
              Something interrupted the reading session
            </h1>
            <p className="text-sm text-stone-600 mb-6 break-words">{this.state.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 text-sm font-medium bg-[#1C1917] text-[#FBF9F5] hover:bg-stone-800 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
