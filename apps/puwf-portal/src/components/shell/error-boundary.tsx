"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallbackLabel: string;
  retryLabel: string;
}

interface State {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Portal error boundary", error, info);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-dvh flex-col items-start justify-center gap-3 bg-page p-8">
          <p className="text-sm text-ink">{this.props.fallbackLabel}</p>
          <button
            type="button"
            className="h-9 rounded-control bg-action px-3 text-sm font-semibold text-[color:var(--on-primary)]"
            onClick={() => this.setState({ hasError: false })}
          >
            {this.props.retryLabel}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
