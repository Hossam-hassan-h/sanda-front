import type { PaginatedResponse } from "../admin-types";

type BackendPagination = {
  page?: number;
  pageSize?: number;
  limit?: number;
  total?: number;
  totalItems?: number;
  totalPages?: number;
};

type BackendListResponse<T> = {
  data?: T[];
  pagination?: BackendPagination;
  total?: number;
  totalItems?: number;
  page?: number;
  pageSize?: number;
  limit?: number;
};

export function compactParams(params?: Record<string, unknown>): Record<string, unknown> {
  if (!params) return {};
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  );
}

export function normalizePaginatedResponse<T>(
  body: BackendListResponse<T>,
  fallback: { page?: number; pageSize?: number } = {},
): PaginatedResponse<T> {
  const data = Array.isArray(body.data) ? body.data : [];
  const pagination = body.pagination ?? {};
  const page = Number(pagination.page ?? body.page ?? fallback.page ?? 1) || 1;
  const pageSize = Number(pagination.pageSize ?? pagination.limit ?? body.pageSize ?? body.limit ?? fallback.pageSize ?? 10) || 10;
  const total = Number(pagination.total ?? pagination.totalItems ?? body.total ?? body.totalItems ?? data.length) || 0;

  return { data, total, page, pageSize };
}
