import * as React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

import { cn } from '@kinetix/utils';
import { Button } from './button';

interface PaginationProps extends React.HTMLAttributes<HTMLDivElement> {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function getPageNumbers(page: number, totalPages: number): (number | '...')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages = new Set<number>([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const result: (number | '...')[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) result.push('...');
    result.push(p);
    prev = p;
  }
  return result;
}

const Pagination = ({ className, page, totalPages, onPageChange, ...props }: PaginationProps) => {
  if (totalPages <= 1) return null;
  return (
    <div className={cn('flex items-center justify-center gap-1', className)} {...props}>
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 rounded-lg"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft />
      </Button>
      {getPageNumbers(page, totalPages).map((p, i) =>
        p === '...' ? (
          <span key={`e-${i}`} className="flex h-9 w-9 items-center justify-center">
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          </span>
        ) : (
          <Button
            key={p}
            variant={p === page ? 'default' : 'outline'}
            size="icon"
            className="h-9 w-9 rounded-lg"
            onClick={() => onPageChange(p)}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </Button>
        ),
      )}
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 rounded-lg"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        aria-label="Next page"
      >
        <ChevronRight />
      </Button>
    </div>
  );
};
Pagination.displayName = 'Pagination';

export { Pagination };
