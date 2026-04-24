/**
 * Reusable pagination bar.
 * Props:
 *   pagination  – { page, totalPages, total }
 *   onPageChange – (newPage) => void
 *   label       – e.g. "bài hát" | "người dùng"  (optional)
 */
export default function Pagination({ pagination, onPageChange, label = 'mục' }) {
  if (!pagination || pagination.totalPages <= 1) return null;

  const { page, totalPages, total } = pagination;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
    .reduce((acc, p, idx, arr) => {
      if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
      acc.push(p);
      return acc;
    }, []);

  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-sp-border bg-sp-dark shrink-0">
      <p className="text-sp-gray text-sm">
        Trang {page} / {totalPages}
        <span className="ml-2 text-sp-gray-dark">({total} {label})</span>
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          className="px-2.5 py-1.5 rounded-lg text-sm text-sp-gray hover:text-white hover:bg-sp-hover
                     disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          «
        </button>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="px-3 py-1.5 rounded-lg text-sm text-sp-gray hover:text-white hover:bg-sp-hover
                     disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ‹ Trước
        </button>

        {pages.map((p, idx) =>
          p === '...' ? (
            <span key={`e-${idx}`} className="px-2 text-sp-gray-dark text-sm">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                p === page
                  ? 'bg-sp-green text-black'
                  : 'text-sp-gray hover:text-white hover:bg-sp-hover'
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="px-3 py-1.5 rounded-lg text-sm text-sp-gray hover:text-white hover:bg-sp-hover
                     disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Sau ›
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages}
          className="px-2.5 py-1.5 rounded-lg text-sm text-sp-gray hover:text-white hover:bg-sp-hover
                     disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          »
        </button>
      </div>
    </div>
  );
}
