import axios from 'axios';
import useAuthStore from '../store/authStore';
import { getDeviceId } from './deviceId';

export function loginPageHref() {
  const base = import.meta.env.BASE_URL;
  const prefix = base.endsWith('/') ? base.slice(0, -1) : base;
  return `${prefix}/login`;
}

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
  timeout: 120000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  let deviceId;
  try {
    deviceId = getDeviceId();
  } catch {
    deviceId = localStorage.getItem('tt_device_id') || '';
  }
  if (deviceId) {
    config.headers['X-Device-Id'] = deviceId;
    if (config.data instanceof FormData) {
      // Axios tu gan boundary — khong duoc set Content-Type thieu boundary
      if (config.headers) {
        delete config.headers['Content-Type'];
        delete config.headers['content-type'];
      }
    } else if (config.data && typeof config.data === 'object') {
      config.data = { ...config.data, deviceId };
    }
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
      if (msg) alert(msg);
      window.location.href = loginPageHref();
    }
    return Promise.reject(err);
  }
);

export default api;
