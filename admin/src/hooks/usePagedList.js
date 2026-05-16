import { useMemo, useState } from 'react';

export function usePagedList(items, { pageSize = 20, search = '', searchFn } = {}) {
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!search?.trim() || !searchFn) return items;
    const q = search.trim().toLowerCase();
    return items.filter((item) => searchFn(item, q));
  }, [items, search, searchFn]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(page, totalPages);

  const slice = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  const setPageSafe = (p) => setPage(Math.max(1, Math.min(totalPages, p)));

  return { page: safePage, setPage: setPageSafe, total, totalPages, items: slice };
}