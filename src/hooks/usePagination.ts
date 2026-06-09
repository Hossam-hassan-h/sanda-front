import { useState, useEffect, useMemo } from "react";

interface UsePaginationOptions {
  totalItems: number;
  pageSize: number;
  initialPage?: number;
}

/**
 * Encapsulates client-side pagination logic: page state, clamping,
 * reset on filter change, and scroll-to-top.
 */
export function usePagination({ totalItems, pageSize, initialPage = 1 }: UsePaginationOptions) {
  const [page, setPage] = useState(initialPage);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);

  // Clamp page if results shrink
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  // Scroll to top when page changes
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    return () => cancelAnimationFrame(id);
  }, [safePage]);

  const goToPage = (next: number) => {
    if (next < 1 || next > totalPages || next === safePage) return;
    setPage(next);
  };

  const resetPage = () => setPage(1);

  const pageRange = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return { start, end: Math.min(safePage * pageSize, totalItems) };
  }, [safePage, pageSize, totalItems]);

  return { page: safePage, totalPages, goToPage, resetPage, pageRange };
}
