import api from "./client";
import type { AttendanceReportResponse, AdminAttendanceResponse } from "./types";

export interface AttendanceReportParams {
  page?: number;
  limit?: number;
  jobId?: string;
  status?: "checked-in" | "checked-out" | "no-show" | "all";
  workerName?: string;
  fromDate?: string;
  toDate?: string;
}

export interface AttendanceAnalyticsParams {
  page?: number;
  limit?: number;
  fromDate?: string;
  toDate?: string;
}

export const attendanceApi = {
  async getEmployerReport(params: AttendanceReportParams = {}): Promise<AttendanceReportResponse> {
    const query: Record<string, string> = {};
    if (params.page) query.page = String(params.page);
    if (params.limit) query.limit = String(params.limit);
    if (params.jobId) query.jobId = params.jobId;
    if (params.status && params.status !== "all") query.status = params.status;
    if (params.workerName) query.workerName = params.workerName;
    if (params.fromDate) query.fromDate = params.fromDate;
    if (params.toDate) query.toDate = params.toDate;

    const { data } = await api.get("/attendance/reports/employer", { params: query });
    return data as AttendanceReportResponse;
  },

  async getAdminAnalytics(params: AttendanceAnalyticsParams = {}): Promise<AdminAttendanceResponse> {
    const query: Record<string, string> = {};
    if (params.page) query.page = String(params.page);
    if (params.limit) query.limit = String(params.limit);
    if (params.fromDate) query.fromDate = params.fromDate;
    if (params.toDate) query.toDate = params.toDate;

    const { data } = await api.get("/attendance/admin/analytics", { params: query });
    return data as AdminAttendanceResponse;
  },
};
