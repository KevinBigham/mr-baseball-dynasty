import { useEffect, useRef } from 'react';
import { useUIStore, type ToastItem } from '../../store/uiStore';

const ACCENT_MAP: Record<string, string> = {
  success: '#4ade80',
  error:   '#ef4444',
  info:    '#60a5fa',
};

function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const accent = toast.accent ?? ACCENT_MAP[toast.type] ?? '#60a5fa';
  const duration = toast.duration ?? 3000;

  useEffect(() => {
    timerRef.current = setTimeout(onDismiss, duration);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [duration, onDismiss]);

  const bgClass =
    toast.type === 'error'   ? 'bg-red-900/90 border-red-800' :
    toast.type === 'success' ? 'bg-green-900/90 border-green-800' :
                               'bg-gray-800/90 border-gray-700';

  return (
    <div
      role="alert"
      className={`pointer-events-auto flex items-start gap-2 px-4 py-2.5 rounded-lg text-xs font-mono border shadow-lg animate-slide-in-right ${bgClass}`}
      style={{ borderLeft: `4px solid ${accent}` }}
    >
      {toast.icon && <span className="text-sm shrink-0">{toast.icon}</span>}
      <span className={`flex-1 ${
        toast.type === 'error' ? 'text-red-200' :
        toast.type === 'success' ? 'text-green-200' :
        'text-gray-200'
      }`}>
        {toast.message}
      </span>
      <button
        onClick={onDismiss}
        className="shrink-0 text-gray-500 hover:text-white transition-colors ml-1"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useUIStore(s => s.toasts);
  const removeToast = useUIStore(s => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <>
      {/* Inject keyframes once */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.25s ease-out forwards;
        }
      `}</style>
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm">
        {toasts.slice(-5).map(t => (
          <Toast key={t.id} toast={t} onDismiss={() => removeToast(t.id)} />
        ))}
      </div>
    </>
  );
}
