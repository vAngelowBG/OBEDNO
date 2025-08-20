import React from 'react';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const pagesToShow = () => {
    const pages: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, start + 4);
    for (let p = Math.max(1, end - 4); p <= end; p++) pages.push(p);
    return pages;
  };

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-600">
        Показани {Math.min(total, page * pageSize) - Math.min(pageSize - 1, page * pageSize - 1)}–{Math.min(total, page * pageSize)} от {total}
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!canPrev}
          className="px-3 py-1 rounded border text-sm disabled:opacity-50"
        >
          ←
        </button>
        {pagesToShow().map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-8 h-8 rounded border text-sm ${p === page ? 'bg-red-600 text-white border-red-600' : 'bg-white hover:bg-gray-50'}`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!canNext}
          className="px-3 py-1 rounded border text-sm disabled:opacity-50"
        >
          →
        </button>
      </div>
    </div>
  );
}


