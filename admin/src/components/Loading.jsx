import { Loader2 } from 'lucide-react';

export default function Loading({ fullPage, message = 'Đang tải...' }) {
  if (fullPage) {
    return (
      <div className="loading-full-page">
        <Loader2 size={32} className="spinner" />
        <span>{message}</span>
      </div>
    );
  }

  return (
    <div className="loading-container">
      <Loader2 size={20} className="spinner" />
      <span>{message}</span>
    </div>
  );
}
