/**
 * ErrorBoundary.tsx — React error boundary for crash recovery
 *
 * Two usage modes:
 * 1. Top-level: wraps the entire app, shows full-screen CrashScreen
 * 2. Content-level: wraps tab content in Shell, shows inline CrashScreen
 *
 * Usage:
 *   <ErrorBoundary>          — full-screen crash
 *   <ErrorBoundary partial>  — inline crash (nav stays visible)
 */

import { Component, type ReactNode, type ErrorInfo } from 'react';
import CrashScreen from './CrashScreen';

interface Props {
  children: ReactNode;
  /** If true, renders an inline (partial) crash screen instead of full-screen */
  partial?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <CrashScreen
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
          isPartial={this.props.partial}
        />
      );
    }

    return this.props.children;
  }
}
