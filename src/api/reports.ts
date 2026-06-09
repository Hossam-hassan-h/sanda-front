import api, { USE_MOCKS } from "./client";
import { mockReports, mockUsers } from "@/lib/mock/data";
import type { CreateReportPayload, Report, ApiSuccessResponse } from "./types";

const delay = <T>(value: T, ms = 300) =>
  new Promise<T>((r) => setTimeout(() => r(value), ms));

export const reportsApi = {
  /** Submit a new report against a user (optionally tied to a job). */
  async create(payload: CreateReportPayload): Promise<Report> {
    if (USE_MOCKS) {
      const reported = mockUsers.find((u) => u.id === payload.reportedUserId);
      const reportedBy = mockUsers.find((u) => u.id === "u1") ?? mockUsers[0];
      const report: Report = {
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
      mockReports.unshift(report);
      return delay(report);
    }
    const { data } = await api.post<Report>("/reports", payload);
    return data;
  },

  /** List reports filed by the current user. */
  async mine(): Promise<Report[]> {
    if (USE_MOCKS) {
      return delay(mockReports.filter((r) => r.reportedById === "u1"));
    }
    const { data } = await api.get<Report[]>("/reports/mine");
    return data;
  },

  /** Update the status of a report (admin only — but exposed here for completeness). */
  async updateStatus(id: string, status: Report["status"]): Promise<ApiSuccessResponse> {
    if (USE_MOCKS) {
      const r = mockReports.find((x) => x.id === id);
      if (r) r.status = status;
      return delay({ ok: true });
    }
    const { data } = await api.patch<ApiSuccessResponse>(`/reports/${id}/status`, { status });
    return data;
  },
};
