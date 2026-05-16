export function getClientSiteUrl() {
  const env = (import.meta.env.VITE_CLIENT_URL || import.meta.env.VITE_SITE_URL || '').trim();
  if (env) return env.replace(/\/+$/, '');
  if (import.meta.env.DEV) return 'http://localhost:5173';
  if (typeof window !== 'undefined' && window.location?.origin) {
    const { origin, port } = window.location;
    if (port === '4288' || port === '5173') return 'http://127.0.0.1:5173';
    return origin.replace(/\/admin\/?$/, '') || origin;
  }
  return '';
}

export function clientPath(path = '/') {
  const base = getClientSiteUrl();
  const p = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}