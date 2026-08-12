import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/common/Button';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  siblingCount?: number;
}

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function getPageNumbers(
  currentPage: number,
  totalPages: number,
  siblingCount: number,
): (number | 'ellipsis')[] {
  if (totalPages <= 1) return [1];

  const totalVisible = siblingCount * 2 + 5;

  if (totalPages <= totalVisible) {
    return range(1, totalPages);
  }

  const pages: (number | 'ellipsis')[] = [];
  const leftSibling = Math.max(currentPage - siblingCount, 1);
  const rightSibling = Math.min(currentPage + siblingCount, totalPages);

  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < totalPages - 1;

  pages.push(1);

  if (showLeftEllipsis) {
    pages.push('ellipsis');
  } else {
    pages.push(...range(2, leftSibling - 1));
  }

  pages.push(...range(leftSibling, rightSibling));

  if (showRightEllipsis) {
    pages.push('ellipsis');
  } else {
    pages.push(...range(rightSibling + 1, totalPages - 1));
  }

  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return [...new Set(pages.map(String))].map((page) =>
    page === 'ellipsis' ? 'ellipsis' : Number(page),
  ) as (number | 'ellipsis')[];
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
  siblingCount = 1,
}: PaginationProps) {
  if (totalPages <= 0) return null;

  const pages = getPageNumbers(currentPage, totalPages, siblingCount);
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <nav
      aria-label="Pagination"
      className={cn('flex items-center justify-center gap-1', className)}
    >
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!canGoPrev}
        aria-label="Go to previous page"
        className="px-2.5"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
      </Button>

      <ul className="flex items-center gap-1">
        {pages.map((page, index) =>
          page === 'ellipsis' ? (
            <li key={`ellipsis-${index}`} aria-hidden="true">
              <span className="px-2 text-sm text-text-secondary">…</span>
            </li>
          ) : (
            <li key={page}>
              <button
                type="button"
                onClick={() => onPageChange(page)}
                aria-label={`Go to page ${page}`}
                aria-current={page === currentPage ? 'page' : undefined}
                className={cn(
                  'flex size-8 items-center justify-center rounded-lg text-sm font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2',
                  page === currentPage
                    ? 'bg-primary text-white'
                    : 'text-text-primary hover:bg-background',
                )}
              >
                {page}
              </button>
            </li>
          ),
        )}
      </ul>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!canGoNext}
        aria-label="Go to next page"
        className="px-2.5"
      >
        <ChevronRight className="size-4" aria-hidden="true" />
      </Button>
    </nav>
  );
}
