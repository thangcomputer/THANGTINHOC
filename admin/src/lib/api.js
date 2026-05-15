import axios from 'axios';
import useAuthStore from '../store/authStore';

function resolveApiBase() {
  const env = import.meta.env.VITE_API_URL;
  if (env && !/127\.0\.0\.1|localhost/i.test(env)) return env.replace(/\/+$/, '');
  if (import.meta.env.PROD) return '/api';
  return env || 'http://localhost:5000/api';
}

const API_BASE = resolveApiBase();

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
