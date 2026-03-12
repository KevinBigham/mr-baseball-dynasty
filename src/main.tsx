import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import ErrorBoundary from './components/layout/ErrorBoundary';

// Global error handlers for non-React errors
window.onerror = (_msg, _src, _line, _col, error) => {
  console.error('[Global] Uncaught error:', error);
};
window.onunhandledrejection = (event: PromiseRejectionEvent) => {
  console.error('[Global] Unhandled rejection:', event.reason);
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
