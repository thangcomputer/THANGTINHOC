import { InboxIcon } from 'lucide-react';

export default function EmptyState({ icon: Icon = InboxIcon, title, message }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon size={48} />
      </div>
      {title && <h3>{title}</h3>}
      <p>{message || 'Chưa có dữ liệu nào.'}</p>
    </div>
  );
}
