import { useState, useCallback } from "react";

interface UsePaginationReturn {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setTotalItems: (total: number) => void;
}

export function usePagination(initialPage = 1, initialPageSize = 10): UsePaginationReturn {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalItems, setTotalItems] = useState(0);

  const totalPages = Math.ceil(totalItems / pageSize);

  const handleSetPageSize = useCallback((size: number) => {
    setPageSize(size);
    setPage(1);
  }, []);

  return {
    page,
    pageSize,
    totalPages,
    totalItems,
    setPage,
    setPageSize: handleSetPageSize,
    setTotalItems,
  };
}