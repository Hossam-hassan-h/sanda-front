import { useCallback, useMemo } from "react";
import { usePagination } from "./usePagination";
import { useFilters, type FilterState } from "./useFilters";
import { useSearch } from "./useSearch";
import { useSorting } from "./useSorting";
import { useModal } from "./useModal";
import { useErrorHandler } from "./useErrorHandler";

interface UseAdminTableParams {
  initialPage?: number;
  initialPageSize?: number;
  initialFilters?: FilterState;
  debounceMs?: number;
}

interface UseAdminTableReturn {
  // Pagination
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setTotalItems: (total: number) => void;

  // Filters
  filters: FilterState;
  setFilter: (key: string, value: string | string[]) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;

  // Search
  searchValue: string;
  setSearchValue: (value: string) => void;
  debouncedSearch: string;

  // Sorting
  sortKey: string | null;
  sortDirection: "asc" | "desc";
  handleSort: (key: string) => void;
  resetSort: () => void;

  // Modal
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  toggleModal: () => void;

  // Error handling
  error: string | null;
  clearError: () => void;
  handleApiError: (err: unknown) => void;
}

export function useAdminTable({
  initialPage = 1,
  initialPageSize = 10,
  initialFilters = {},
  debounceMs = 300,
}: UseAdminTableParams = {}): UseAdminTableReturn {
  const pagination = usePagination(initialPage, initialPageSize);
  const filters = useFilters(initialFilters);
  const search = useSearch(debounceMs);
  const sorting = useSorting();
  const modal = useModal();
  const errorHandler = useErrorHandler();

  const clearAllFilters = useCallback(() => {
    filters.clearFilters();
    search.setSearchValue("");
    sorting.resetSort();
    pagination.setPage(1);
  }, [filters, search, sorting, pagination]);

  return {
    ...pagination,
    ...filters,
    ...search,
    ...sorting,
    ...modal,
    ...errorHandler,
    clearFilters: clearAllFilters,
    isModalOpen: modal.isOpen,
  };
}