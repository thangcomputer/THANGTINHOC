/** URL cho /uploads — production dung path tuong doi (cung domain). */
export function assetUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  if (import.meta.env.PROD) return path;
  const base = import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5000';
  return `${base}${path}`;
}