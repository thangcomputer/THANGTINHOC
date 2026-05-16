import { useState } from "react";
import { X, Layout, ListTree, Save } from "lucide-react";

const STORAGE_KEY = "home_editor_onboarding_v1";

export default function HomeEditorOnboarding() {
  const [open, setOpen] = useState(() => !localStorage.getItem(STORAGE_KEY));

  if (!open) return null;

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  };

  return (
    <div className="home-editor-onboarding" role="region" aria-label="Hướng dẫn nhanh">
      <button type="button" className="home-editor-onboarding-close" onClick={dismiss} aria-label="Đóng hướng dẫn">
        <X size={16} />
      </button>
      <p className="home-editor-onboarding-title">Bắt đầu chỉnh trang chủ</p>
      <ol className="home-editor-onboarding-steps">
        <li><Layout size={14} /> <strong>Sắp xếp trang</strong> — kéo thứ tự, bật/tắt block</li>
        <li><ListTree size={14} /> <strong>Chỉnh nội dung</strong> — sửa từng phần ở menu trái</li>
        <li><Save size={14} /> <strong>Lưu phần này</strong> hoac <strong>Lưu tất cả</strong>, rồi xem trước bên phải</li>
      </ol>
      <button type="button" className="btn btn-primary btn-sm" onClick={dismiss}>Đã hiểu</button>
    </div>
  );
}