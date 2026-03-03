import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '../../src/components/layout/ErrorBoundary';

// Mock CrashScreen since it has complex deps (Dexie, engine)
vi.mock('../../src/components/layout/CrashScreen', () => ({
  default: ({ error, onReset, isPartial }: {
    error: Error;
    onReset: () => void;
    isPartial?: boolean;
  }) => (
    <div data-testid="crash-screen">
      <span data-testid="error-message">{error.message}</span>
      <span data-testid="is-partial">{String(!!isPartial)}</span>
      <button onClick={onReset} data-testid="reset-button">Reset</button>
    </div>
  ),
}));

// A component that throws on demand
function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Test explosion');
  return <div data-testid="child-content">All good</div>;
}

describe('ErrorBoundary — error catching', () => {
  beforeEach(() => {
    // Suppress React error boundary console output during tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('renders CrashScreen when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByTestId('crash-screen')).toBeInTheDocument();
    expect(screen.getByTestId('error-message')).toHaveTextContent('Test explosion');
  });

  it('passes isPartial=false by default', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByTestId('is-partial')).toHaveTextContent('false');
  });

  it('passes isPartial=true when partial prop is set', () => {
    render(
      <ErrorBoundary partial>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByTestId('is-partial')).toHaveTextContent('true');
  });

  it('provides a reset button in crash screen', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByTestId('reset-button')).toBeInTheDocument();
  });
});

describe('ErrorBoundary — reset recovery', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('recovers when error condition is resolved after reset', () => {
    let shouldThrow = true;

    function ConditionalThrower() {
      if (shouldThrow) throw new Error('Conditional error');
      return <div data-testid="recovered">Recovered!</div>;
    }

    render(
      <ErrorBoundary>
        <ConditionalThrower />
      </ErrorBoundary>
    );

    // Should show crash screen
    expect(screen.getByTestId('crash-screen')).toBeInTheDocument();

    // Fix the error condition
    shouldThrow = false;

    // Click reset
    fireEvent.click(screen.getByTestId('reset-button'));

    // Should show recovered content
    expect(screen.getByTestId('recovered')).toBeInTheDocument();
  });
});
