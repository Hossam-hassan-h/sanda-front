import { useState, useCallback } from "react";

interface UseSortingReturn {
  sortKey: string | null;
  sortDirection: "asc" | "desc";
  handleSort: (key: string) => void;
  resetSort: () => void;
}

export function useSorting(): UseSortingReturn {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = useCallback((key: string) => {
    setSortKey((prevKey) => {
      if (prevKey !== key) {
        setSortDirection("asc");
        return key;
      }
      setSortDirection((prevDir) => (prevDir === "asc" ? "desc" : "asc"));
      return key;
    });
  }, []);

  const resetSort = useCallback(() => {
    setSortKey(null);
    setSortDirection("asc");
  }, []);

  return {
    sortKey,
    sortDirection,
    handleSort,
    resetSort,
  };
}