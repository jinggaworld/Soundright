"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * ErrorBoundary - Catches React rendering errors and displays a fallback UI.
 *
 * @example
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 *
 * @example
 * <ErrorBoundary fallback={<CustomError />}>
 *   <MyComponent />
 * </ErrorBoundary>
 */
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg bg-sr-surface p-8">
            <AlertTriangle size={48} className="mb-4 text-sr-warning" />
            <h2 className="mb-2 text-xl font-bold text-sr-text">
              Something went wrong
            </h2>
            <p className="mb-4 max-w-md text-center text-sm text-sr-text-secondary">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="flex items-center gap-2 rounded-full bg-sr-green px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-sr-green/80"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
