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

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-center">
          <div className="h-14 w-14 rounded-2xl bg-[#C53030]/10 flex items-center justify-center text-[#C53030] mb-4">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h1 className="font-display text-2xl font-bold text-[#1E2022]">
            Something unexpected occurred
          </h1>
          <p className="text-sm text-[#5C6360] mt-2 max-w-md">
            BazaarMind ran into an interface error. Tap below to reload the market signals safely.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#1E5631] text-[#FDFBF7] px-6 py-3 text-sm font-semibold hover:bg-[#194727] transition-colors"
          >
            <RefreshCw className="h-4 w-4" /> Reload BazaarMind
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
