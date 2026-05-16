import { Eye, Plus, Save, Loader2, PanelRightOpen, PanelRightClose } from "lucide-react";

export default function HomeEditorSectionHead({
  tab,
  count,
  countLabel,
  onAdd,
  addLabel,
  onSaveSection,
  savingSection,
  showPreview,
  onTogglePreview,
}) {
  if (!tab) return null;
  const Icon = tab.icon;
  return (
    <header className="home-editor-section-head">
      <div className="home-editor-section-head-main">
        <h2 className="home-editor-section-title">
          <Icon size={20} />
          {tab.label}
        </h2>
        <p className="home-editor-section-desc">
          {tab.desc}
          {count !== undefined && countLabel ? (
            <span className="home-editor-section-count">
              {" "}
              · <strong>{count}</strong> {countLabel}
            </span>
          ) : null}
        </p>
      </div>
      <div className="home-editor-section-actions">
        {onAdd && addLabel ? (
          <button type="button" className="btn btn-outline btn-sm" onClick={onAdd}>
            <Plus size={16} /> {addLabel}
          </button>
        ) : null}
        <button
          type="button"
          className={`btn btn-outline btn-sm${showPreview ? " active" : ""}`}
          onClick={onTogglePreview}
          title="Xem trước trang chủ"
        >
          {showPreview ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
          Xem trước
        </button>
        <a href="/" target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
          <Eye size={14} /> Trang chủ
        </a>
        <button type="button" className="btn btn-primary btn-sm" onClick={onSaveSection} disabled={savingSection}>
          {savingSection ? <Loader2 size={14} className="spinner" /> : <Save size={14} />}
          Lưu phần này
        </button>
      </div>
    </header>
  );
}