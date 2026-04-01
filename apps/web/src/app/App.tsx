import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ErrorBoundary } from './providers/ErrorBoundary';
import { AppRoutes } from './routes';

export function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#0F1930',
              border: '1px solid #1E3A6E',
              color: '#E2E8F0',
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '0.875rem',
            },
          }}
        />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
