import { useState, useCallback } from "react";
import { useDebounce } from "../use-debounce";

interface UseSearchReturn {
  searchValue: string;
  setSearchValue: (value: string) => void;
  debouncedSearch: string;
}

export function useSearch(debounceMs = 300): UseSearchReturn {
  const [searchValue, setSearchValue] = useState("");
  const debouncedSearch = useDebounce(searchValue, debounceMs);

  return {
    searchValue,
    setSearchValue,
    debouncedSearch,
  };
}