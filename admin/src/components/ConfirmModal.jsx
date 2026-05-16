import { AlertTriangle } from 'lucide-react';

export default function ConfirmModal({
  open,
  title = 'Xac nhan',
  message,
  confirmLabel = 'Xac nhan',
  cancelLabel = 'Huy',
  danger = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="modal-overlay confirm-modal-overlay" role="dialog" aria-modal="true" onClick={onCancel}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className={`confirm-modal-icon ${danger ? 'danger' : ''}`}>
          <AlertTriangle size={22} />
        </div>
        <h3 className="confirm-modal-title">{title}</h3>
        {message && <p className="confirm-modal-message">{message}</p>}
        <div className="confirm-modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}