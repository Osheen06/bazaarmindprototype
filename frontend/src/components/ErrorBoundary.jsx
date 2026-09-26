import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-3xl bg-[#FDFBF7] border border-[#E5DEC9] p-8 flex flex-col items-center justify-center text-center my-6 shadow-sm">
          <div className="h-12 w-12 rounded-2xl bg-[#C53030]/10 flex items-center justify-center text-[#C53030] mb-3">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h2 className="font-display text-xl font-bold text-[#1E2022]">
            Market signals temporarily paused
          </h2>
          <p className="text-xs text-[#5C6360] mt-1.5 max-w-sm">
            BazaarMind ran into an unexpected view update. You can safely try again or reload the page.
          </p>
          <div className="mt-5 flex items-center gap-2 flex-wrap justify-center">
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#1E5631] text-[#FDFBF7] px-4 py-2 text-xs font-semibold hover:bg-[#194727] transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#E5DEC9] bg-white text-[#1E2022] px-4 py-2 text-xs font-semibold hover:bg-[#F7F4EE] transition-colors"
            >
              Reload BazaarMind
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
