export function getPublicSiteUrl() {
  const env = (import.meta.env.VITE_SITE_URL || import.meta.env.VITE_CLIENT_URL || '').trim();
  if (env) return env.replace(/\/+$/, '');
  if (import.meta.env.DEV) return 'http://localhost:5173';
  return 'https://thangtinhoc.edu.vn';
}

export function blogPostUrl(slug) {
  const base = getPublicSiteUrl();
  const s = (slug || '').replace(/^\/+/, '');
  return `${base}/blog/${s || '...'}`;
}