import axios from 'axios';
import useAuthStore from '../store/authStore';
import { getDeviceId } from './deviceId';

function resolveApiBase() {
  const env = (import.meta.env.VITE_API_URL || '').trim();
  if (import.meta.env.DEV) return env || 'http://localhost:5000/api';
  if (env.startsWith('/')) return env.replace(/\/+$/, '');
  if (!env || /127\.0\.0\.1|localhost/i.test(env)) return '/api';
  return env.replace(/\/+$/, '');
}

const API_BASE = resolveApiBase();

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers['X-Device-Id'] = getDeviceId();
  if (config.data && typeof config.data === 'object' && !(config.data instanceof FormData)) {
    config.data = { ...config.data, deviceId: getDeviceId() };
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const code = err.response?.data?.code;
    if (status === 401 || status === 403) {
      const msg = err.response?.data?.message;
      if (code === 'SESSION_IDLE' || code === 'SESSION_DEVICE' || code === 'SESSION_INVALID' || code === 'SESSION_IP') {
        useAuthStore.getState().logout();
        if (msg && !window.__sessionAlertShown) {
          window.__sessionAlertShown = true;
          setTimeout(() => { window.__sessionAlertShown = false; }, 3000);
          alert(msg);
        }
      } else if (status === 401) {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(err);
  }
);

export default api;
