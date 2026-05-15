import axios from 'axios';
import useAuthStore from '../store/authStore';

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
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(err);
  }
);

export default api;
