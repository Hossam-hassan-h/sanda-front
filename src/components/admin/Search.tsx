import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, X } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

interface SearchProps {
  placeholder?: string;
  onSearch: (value: string) => void;
  defaultValue?: string;
  debounceMs?: number;
}

export function Search({
  placeholder = "بحث...",
  onSearch,
  defaultValue = "",
  debounceMs = 300,
}: SearchProps) {
  const [value, setValue] = useState(defaultValue);
  const debouncedValue = useDebounce(value, debounceMs);

  useEffect(() => {
    onSearch(debouncedValue);
  }, [debouncedValue, onSearch]);

  const clearSearch = useCallback(() => {
    setValue("");
    onSearch("");
  }, [onSearch]);

  return (
    <div className="relative">
      <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="pr-10 pl-10 w-full sm:w-64"
      />
      {value && (
        <button
          onClick={clearSearch}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
