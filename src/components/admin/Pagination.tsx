import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const PAGE_SIZES = [10, 25, 50, 100];

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const safeTotalItems = Math.max(Number(totalItems) || 0, 0);
  const safePageSize = Math.max(Number(pageSize) || 10, 1);
  const safeTotalPages = Math.max(Number(totalPages) || 1, 1);
  const safeCurrentPage = Math.min(Math.max(Number(currentPage) || 1, 1), safeTotalPages);
  const startItem = safeTotalItems === 0 ? 0 : (safeCurrentPage - 1) * safePageSize + 1;
  const endItem = Math.min(safeCurrentPage * safePageSize, safeTotalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t">
      <div className="text-sm text-muted-foreground">
        عرض {startItem}–{endItem} من {safeTotalItems} نتيجة
      </div>

      <div className="flex items-center gap-2">
        <Select
          value={String(safePageSize)}
          onValueChange={(value) => onPageSizeChange(Number(value))}
        >
          <SelectTrigger className="w-20 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZES.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(safeCurrentPage - 1)}
            disabled={safeCurrentPage <= 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: safeTotalPages }, (_, i) => i + 1)
              .filter((page) => {
                const isFirst = page === 1;
                const isLast = page === safeTotalPages;
                const isNearCurrent = Math.abs(page - safeCurrentPage) <= 1;
                return isFirst || isLast || isNearCurrent;
              })
              .map((page, index, filtered) => {
                const showEllipsis = index > 0 && page - filtered[index - 1] > 1;
                return (
                  <div key={page} className="flex items-center">
                    {showEllipsis && <span className="px-2 text-muted-foreground">…</span>}
                    <Button
                      type="button"
                      variant={page === safeCurrentPage ? "default" : "outline"}
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => onPageChange(page)}
                    >
                      {page}
                    </Button>
                  </div>
                );
              })}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(safeCurrentPage + 1)}
            disabled={safeCurrentPage >= safeTotalPages}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
