import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
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

// basename matches vite.config.ts base for GitHub Pages deploy
// In dev mode the base is '/', in production it's '/mr-baseball-dynasty/'
const basename = (window.location.pathname.startsWith('/mr-baseball-dynasty')
  ? '/mr-baseball-dynasty'
  : '');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>,
);
