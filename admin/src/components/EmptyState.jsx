import { InboxIcon } from 'lucide-react';

export default function EmptyState({ icon: Icon = InboxIcon, title, message, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon size={48} aria-hidden />
      </div>
      {title && <h3>{title}</h3>}
      <p>{message || 'Chưa có dữ liệu nào.'}</p>
      {actionLabel && onAction && (
        <button type="button" className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
