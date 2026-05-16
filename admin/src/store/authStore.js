import { create } from 'zustand';

function loadStoredUser() {
  try {
    const raw = localStorage.getItem('admin_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    localStorage.removeItem('admin_user');
    return null;
  }
}

const useAuthStore = create((set) => ({
  user: loadStoredUser(),
  token: localStorage.getItem('admin_token') || null,
  isAuthenticated: !!localStorage.getItem('admin_token'),

  login: (user, token, deviceId) => {
    if (user.role !== 'admin') throw new Error('Cần quyền Admin để truy cập');
    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin_user', JSON.stringify(user));
    if (deviceId) localStorage.setItem('tt_device_id', deviceId);
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateUser: (user) => {
    localStorage.setItem('admin_user', JSON.stringify(user));
    set({ user });
  },
}));

export default useAuthStore;
