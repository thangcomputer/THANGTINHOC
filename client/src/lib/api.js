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

const SESSION_LOGOUT_CODES = new Set([
  'SESSION_IDLE',
  'SESSION_DEVICE',
  'SESSION_INVALID',
  'SESSION_IP',
]);

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const code = err.response?.data?.code;
    const hadToken = !!err.config?.headers?.Authorization;
    if (hadToken && (status === 401 || status === 403) && SESSION_LOGOUT_CODES.has(code)) {
      const msg = err.response?.data?.message;
      useAuthStore.getState().logout();
      if (msg && !window.__sessionAlertShown) {
        window.__sessionAlertShown = true;
        setTimeout(() => { window.__sessionAlertShown = false; }, 3000);
        alert(msg);
      }
    }
    return Promise.reject(err);
  }
);

export default api;
