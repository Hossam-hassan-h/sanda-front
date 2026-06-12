import api, { USE_MOCKS } from "@/api/client";
import type { Report } from "@/api/types";
import type { PaginatedResponse, AdminReportsParams } from "../admin-types";
import { mockReports } from "@/lib/mock/data";

function filterMockReports(params?: AdminReportsParams): Report[] {
  let items = [...mockReports];
  if (params?.search) {
    const q = params.search.toLowerCase();
    items = items.filter((r) => r.reason.toLowerCase().includes(q));
  }
  if (params?.status && params.status !== "all") {
    items = items.filter((r) => r.status === params.status);
  }
  return items;
}

export async function fetchReports(params?: AdminReportsParams): Promise<PaginatedResponse<Report> | null> {
  if (USE_MOCKS) {
    const filtered = filterMockReports(params);
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 10;
    return {
      data: filtered.slice((page - 1) * pageSize, page * pageSize),
      total: filtered.length,
      page,
      pageSize,
    };
  }
  try {
    const response = await api.get("/admin/reports", { params });
    const body = response.data as { data: Report[] };
    let items = body.data ?? [];

    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter((r) => r.reason.toLowerCase().includes(q));
    }

    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 10;
    return {
      data: items.slice((page - 1) * pageSize, page * pageSize),
      total: items.length,
      page,
      pageSize,
    };
  } catch {
    return null;
  }
}

export async function fetchReportById(id: string): Promise<Report | null> {
  if (USE_MOCKS) {
    return mockReports.find((r) => r.id === id) ?? null;
  }
  try {
    const response = await api.get(`/admin/reports/${id}`);
    return response.data as Report;
  } catch {
    return null;
  }
}

export async function updateReportStatus(id: string, status: "open" | "reviewed" | "closed"): Promise<{ ok: true } | null> {
  if (USE_MOCKS) {
    const r = mockReports.find((x) => x.id === id);
    if (r) r.status = status;
    return { ok: true };
  }
  try {
    await api.patch(`/admin/reports/${id}/status`, { status });
    return { ok: true };
  } catch {
    return null;
  }
}

export async function deleteReport(id: string): Promise<{ ok: true } | null> {
  if (USE_MOCKS) {
    const idx = mockReports.findIndex((x) => x.id === id);
    if (idx !== -1) mockReports.splice(idx, 1);
    return { ok: true };
  }
  try {
    await api.delete(`/admin/reports/${id}`);
    return { ok: true };
  } catch {
    return null;
  }
}
