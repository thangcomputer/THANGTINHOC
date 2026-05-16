import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('admin_user') || 'null'),
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
