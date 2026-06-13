import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught application error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-navy px-6 flex items-center justify-center">
          <div className="w-full max-w-sm rounded-2xl border border-gold/60 bg-navy-2 p-6 text-center shadow-gold">
            <h1 className="font-display text-xl font-bold text-gold">
              Something went wrong — refresh to rejoin
            </h1>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 rounded-xl bg-gold px-6 py-3 font-semibold text-navy active:scale-[0.99] transition"
            >
              Refresh
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
