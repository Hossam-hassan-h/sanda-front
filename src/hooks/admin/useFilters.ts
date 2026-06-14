import { useState, useCallback } from "react";

export interface FilterState {
  [key: string]: string | string[] | undefined;
}

interface UseFiltersReturn {
  filters: FilterState;
  setFilter: (key: string, value: string | string[]) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

export function useFilters(initialFilters: FilterState = {}): UseFiltersReturn {
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  const setFilter = useCallback((key: string, value: string | string[]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== undefined && value !== "" && (Array.isArray(value) ? value.length > 0 : true)
  );

  return {
    filters,
    setFilter,
    clearFilters,
    hasActiveFilters,
  };
}