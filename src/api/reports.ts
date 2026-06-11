import api, { USE_MOCKS } from "./client";
import { mockDelay } from "@/lib/mock/utils";
import { mockReports, mockUsers } from "@/lib/mock/data";
import type { CreateReportPayload, Report, ApiSuccessResponse } from "./types";

const mockCreateReport = (payload: CreateReportPayload): Report => {
  const reported = mockUsers.find((u) => u.id === payload.reportedUserId);
  const reportedBy = mockUsers.find((u) => u.id === "u1") ?? mockUsers[0];
  return {
    id: "rp" + Date.now(),
    reportedUserId: payload.reportedUserId,
    reportedUser: {
      id: reported?.id ?? payload.reportedUserId,
      name: reported?.name ?? "مستخدم",
      avatar: reported?.avatar,
      rating: reported?.rating,
    },
    reportedById: reportedBy.id,
    reportedBy: {
      id: reportedBy.id,
      name: reportedBy.name,
      avatar: reportedBy.avatar,
    },
    reason: payload.reason,
    status: "open",
    jobId: payload.jobId,
    createdAt: new Date().toISOString(),
  };
};

export const reportsApi = {
  async create(payload: CreateReportPayload): Promise<Report> {
    if (!USE_MOCKS) {
      try { const { data } = await api.post<Report>("/reports", payload); return data; } catch { /* fallback */ }
    }
    const report = mockCreateReport(payload);
    mockReports.unshift(report);
    return mockDelay(report);
  },

  async mine(): Promise<Report[]> {
    if (!USE_MOCKS) {
      try { const { data } = await api.get<Report[]>("/reports/mine"); return data; } catch { /* fallback */ }
    }
    return mockDelay(mockReports.filter((r) => r.reportedById === "u1"));
  },

  async updateStatus(id: string, status: Report["status"]): Promise<ApiSuccessResponse> {
    if (!USE_MOCKS) {
      try { const { data } = await api.patch<ApiSuccessResponse>(`/reports/${id}/status`, { status }); return data; } catch { /* fallback */ }
    }
    const r = mockReports.find((x) => x.id === id);
    if (r) r.status = status;
    return mockDelay({ ok: true });
  },
};
