import { useEffect } from 'react';
import { useUIStore } from '../../store/uiStore';

export default function ToastContainer() {
  const toasts = useUIStore(s => s.toasts);
  const removeToast = useUIStore(s => s.removeToast);

  useEffect(() => {
    if (toasts.length === 0) return;
    const latest = toasts[toasts.length - 1];
    const timer = setTimeout(() => removeToast(latest.id), 3000);
    return () => clearTimeout(timer);
  }, [toasts, removeToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          role="alert"
          className={`pointer-events-auto px-4 py-2 rounded text-xs font-mono border shadow-lg transition-opacity ${
            t.type === 'error'
              ? 'bg-red-900/90 border-red-700 text-red-200'
              : t.type === 'success'
                ? 'bg-green-900/90 border-green-700 text-green-200'
                : 'bg-gray-800/90 border-gray-600 text-gray-200'
          }`}
        >
          {t.message}
          <button
            onClick={() => removeToast(t.id)}
            className="ml-3 text-gray-400 hover:text-white"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
