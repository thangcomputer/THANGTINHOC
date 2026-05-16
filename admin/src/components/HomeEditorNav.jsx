import { Eye } from "lucide-react";

export default function HomeEditorNav({ groups, tabById, activeTab, onSelect, onVisual }) {
  return (
    <nav className="home-editor-nav" aria-label="Các phần trang chủ">
      {groups.map((group) => (
        <div key={group.title} className="home-editor-nav-group">
          <div className="home-editor-nav-group-title">{group.title}</div>
          {group.ids.map((id) => {
            const tab = tabById[id];
            if (!tab) return null;
            const Icon = tab.icon;
            return (
              <button
                key={id}
                type="button"
                className={`home-editor-nav-item${activeTab === id ? " active" : ""}`}
                onClick={() => onSelect(id)}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      ))}
      <button type="button" className="home-editor-nav-overview" onClick={onVisual}>
        <Eye size={15} /> Sắp xếp trang
      </button>
    </nav>
  );
}