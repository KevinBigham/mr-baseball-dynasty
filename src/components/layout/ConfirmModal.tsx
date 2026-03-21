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

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
      <div className="mbd-card-overlay p-6 max-w-sm w-full">
        {title && <div id="confirm-modal-title" className="mbd-card-header rounded-t -mx-6 -mt-6 mb-4 px-6 py-3">{title}</div>}
        <div className="text-sm mb-5" style={{ color: '#E2E8F0' }}>{message}</div>
        <div className="flex gap-3">
          <button onClick={onConfirm}
            className={`flex-1 mbd-btn mbd-btn-md ${variant === 'danger' ? 'mbd-btn-danger' : 'mbd-btn-filled'}`}>
            {confirmLabel}
          </button>
          <button onClick={onCancel}
            className="flex-1 mbd-btn mbd-btn-md mbd-btn-subtle">
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
