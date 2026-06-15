import { useQuery } from "@tanstack/react-query";
import { attendanceApi, type AttendanceReportParams, type AttendanceAnalyticsParams } from "@/api/attendance";

export const useEmployerAttendanceReport = (params: AttendanceReportParams) =>
  useQuery({
    queryKey: ["attendance", "employer-report", params],
    queryFn: () => attendanceApi.getEmployerReport(params),
    refetchInterval: 30000,
  });

export const useAdminAttendanceAnalytics = (params: AttendanceAnalyticsParams) =>
  useQuery({
    queryKey: ["attendance", "admin-analytics", params],
    queryFn: () => attendanceApi.getAdminAnalytics(params),
    refetchInterval: 15000,
  });
