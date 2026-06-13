import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface FilterOption {
  value: string;
  label: string;
}

interface FilterConfig {
  key: string;
  label: string;
  type: "select" | "multi-select";
  options: FilterOption[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
}

interface FilterBarProps {
  filters: FilterConfig[];
  onClearAll: () => void;
  children?: ReactNode;
}

export function FilterBar({ filters, onClearAll, children }: FilterBarProps) {
  const hasActiveFilters = filters.some((f) => 
    f.type === "multi-select" ? f.value.length > 0 : f.value !== ""
  );

  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 p-4 bg-card border border-border rounded-xl">
      {filters.map((filter) => (
        <div key={filter.key} className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">{filter.label}</label>
          <select
            value={filter.type === "multi-select" ? (filter.value as string[]).join(",") : filter.value}
            onChange={(e) => {
              const selected = e.target.value;
              if (filter.type === "multi-select") {
                const values = selected ? selected.split(",") : [];
                filter.onChange(values);
              } else {
                filter.onChange(selected);
              }
            }}
            className="h-9 px-3 rounded-md border border-border bg-background text-sm min-w-32 w-full sm:w-auto"
            multiple={filter.type === "multi-select"}
          >
            <option value="">الكل</option>
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ))}

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-9 px-3 text-xs"
        >
          <X className="h-3 w-3 ml-1" />
          مسح الفلاتر
        </Button>
      )}

      {children}
    </div>
  );
}
