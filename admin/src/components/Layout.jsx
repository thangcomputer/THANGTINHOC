import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const COLLAPSE_KEY = 'admin_sidebar_collapsed';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
    } catch { /* ignore */ }
  }, [collapsed]);

  return (
    <div className={`admin-layout ${collapsed ? 'sidebar-is-collapsed' : ''}`}>
      {/* Mobile overlay */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} 
        onClick={() => setSidebarOpen(false)}
      />
      
      <Sidebar
        isOpen={sidebarOpen}
        closeSidebar={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
      />
      
      <div className="main-content">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="page-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
