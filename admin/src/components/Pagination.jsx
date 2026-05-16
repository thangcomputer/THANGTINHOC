export default function Pagination({ page, totalPages, total, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null;

  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  if (start > 1) {
    pages.push(1);
    if (start > 2) pages.push('...');
  }
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < totalPages) {
    if (end < totalPages - 1) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div className="pagination-bar" role="navigation" aria-label="Phan trang">
      <span className="pagination-meta">
        {total != null ? `${total} muc • ` : ''}Trang {page}/{totalPages}
      </span>
      <div className="pagination-controls">
        <button type="button" className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Trang truoc">←</button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`e${i}`} className="pagination-ellipsis">…</span>
          ) : (
            <button
              key={p}
              type="button"
              className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => onPageChange(p)}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          )
        )}
        <button type="button" className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} aria-label="Trang sau">→</button>
      </div>
    </div>
  );
}