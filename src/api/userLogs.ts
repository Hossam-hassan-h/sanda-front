import api, { USE_MOCKS } from "./client";
import { mockDelay } from "@/lib/mock/utils";
import type { UserLog } from "./types";
import { mockUserLogs } from "@/lib/mock/data";

export interface UserLogFilters {
  userId?: string;
  targetType?: string;
  from?: string;
  to?: string;
}

export const userLogsApi = {
  /** List user activity logs (admin only). */
  async list(filters: UserLogFilters = {}): Promise<UserLog[]> {
    if (USE_MOCKS) {
      let result = [...mockUserLogs];
      if (filters.userId) result = result.filter((l) => l.userId === filters.userId);
      if (filters.targetType) result = result.filter((l) => l.targetType === filters.targetType);
      if (filters.from) result = result.filter((l) => l.createdAt >= filters.from!);
      if (filters.to) result = result.filter((l) => l.createdAt <= filters.to!);
      result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return mockDelay(result);
    }
    const { data } = await api.get<UserLog[]>("/admin/user-logs", { params: filters });
    return data;
  },

  /** Get activity logs for a single user (admin or self). */
  async forUser(userId: string): Promise<UserLog[]> {
    if (USE_MOCKS) {
      return mockDelay(
        mockUserLogs
          .filter((l) => l.userId === userId)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      );
    }
    const { data } = await api.get<UserLog[]>(`/users/${userId}/logs`);
    return data;
  },
};
