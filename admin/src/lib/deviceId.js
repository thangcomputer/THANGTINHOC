const STORAGE_KEY = 'tt_device_id';

export function getDeviceId() {
  try {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id || id.length < 8) {
      id = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `dev-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    const fallback = `fallback-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
    try { localStorage.setItem(STORAGE_KEY, fallback); } catch { /* ignore */ }
    return fallback;
  }
}

// Tao ma thiet bi ngay khi import module
getDeviceId();