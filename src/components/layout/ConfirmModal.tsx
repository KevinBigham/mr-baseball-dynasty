import { useEscapeKey } from '../../hooks/useEscapeKey';

interface ConfirmModalProps {
  message: string;
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  message,
  title,
  confirmLabel = 'CONFIRM',
  cancelLabel = 'CANCEL',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEscapeKey(onCancel);
  const btnClass = variant === 'danger'
    ? 'bg-red-700 hover:bg-red-600 text-white'
    : 'bg-orange-700 hover:bg-orange-600 text-white';

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
      <div className="bloomberg-border bg-gray-900 p-6 max-w-sm">
        {title && <div id="confirm-modal-title" className="text-orange-400 text-xs font-bold uppercase tracking-widest mb-2">{title}</div>}
        <div className="text-gray-200 text-sm mb-4">{message}</div>
        <div className="flex gap-3">
          <button onClick={onConfirm}
            className={`flex-1 ${btnClass} font-bold text-xs py-2 uppercase tracking-widest min-h-[44px]`}>
            {confirmLabel}
          </button>
          <button onClick={onCancel}
            className="flex-1 border border-gray-600 hover:border-gray-400 text-gray-400 font-bold text-xs py-2 uppercase tracking-widest min-h-[44px]">
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
