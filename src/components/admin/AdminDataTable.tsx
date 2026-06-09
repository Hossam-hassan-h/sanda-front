import { memo, type ReactNode } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render: (item: T) => ReactNode;
  className?: string;
}

export interface AdminDataTableProps<T extends { id: string | number }> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
  sortKey?: string;
  sortDirection?: "asc" | "desc";
  onSortChange?: (key: string) => void;
  actions?: (item: T) => ReactNode;
  onRowClick?: (item: T) => void;
  mobileRender?: (item: T) => ReactNode;
}

function DesktopTable<T extends { id: string | number }>({
  data,
  columns,
  sortKey,
  sortDirection,
  onSortChange,
  actions,
  onRowClick,
}: Omit<AdminDataTableProps<T>, "isLoading" | "emptyMessage" | "mobileRender">) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead
              key={column.key}
              className={cn(
                column.sortable && "cursor-pointer select-none hover:bg-muted/50",
                column.className
              )}
              onClick={() => column.sortable && onSortChange?.(column.key)}
            >
              <div className="flex items-center gap-1">
                {column.header}
                {column.sortable && sortKey === column.key && (
                  <span className="text-primary">
                    {sortDirection === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </span>
                )}
              </div>
            </TableHead>
          ))}
          {actions && <TableHead className="text-end">إجراء</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item) => (
          <TableRow
            key={item.id}
            className={cn(onRowClick && "cursor-pointer")}
            onClick={() => onRowClick?.(item)}
          >
            {columns.map((column) => (
              <TableCell key={column.key} className={column.className}>
                {column.render(item)}
              </TableCell>
            ))}
            {actions && <TableCell className="text-end">{actions(item)}</TableCell>}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export const AdminDataTable = memo(function AdminDataTable<T extends { id: string | number }>({
  data,
  columns,
  isLoading = false,
  emptyMessage = "لا توجد بيانات متاحة",
  sortKey,
  sortDirection,
  onSortChange,
  actions,
  onRowClick,
  mobileRender,
}: AdminDataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="p-6 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-12 text-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  const tableProps = { data, columns, sortKey, sortDirection, onSortChange, actions, onRowClick };

  if (mobileRender) {
    return (
      <>
        <div className="hidden lg:block overflow-x-auto">
          <DesktopTable {...tableProps} />
        </div>
        <div className="block lg:hidden space-y-3 px-4">
          {data.map((item) => (
            <div key={item.id}>{mobileRender(item)}</div>
          ))}
        </div>
      </>
    );
  }

  return (
    <div className="overflow-x-auto">
      <DesktopTable {...tableProps} />
    </div>
  );
}) as <T extends { id: string | number }>(props: AdminDataTableProps<T>) => JSX.Element;
