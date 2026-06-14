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

const filterMockLogs = (filters: UserLogFilters = {}): UserLog[] => {
  let result = [...mockUserLogs];
  if (filters.userId) result = result.filter((l) => l.userId === filters.userId);
  if (filters.targetType) result = result.filter((l) => l.targetType === filters.targetType);
  if (filters.from) result = result.filter((l) => l.createdAt >= filters.from!);
  if (filters.to) result = result.filter((l) => l.createdAt <= filters.to!);
  result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return result;
};

export const userLogsApi = {
  async list(filters: UserLogFilters = {}): Promise<UserLog[]> {
    if (!USE_MOCKS) {
      try { const { data } = await api.get<UserLog[]>("/admin/user-logs", { params: filters }); return data; } catch { /* fallback */ }
    }
    return mockDelay(filterMockLogs(filters));
  },

  async forUser(userId: string): Promise<UserLog[]> {
    if (!USE_MOCKS) {
      try { const { data } = await api.get<UserLog[]>(`/users/${userId}/logs`); return data; } catch { /* fallback */ }
    }
    return mockDelay(filterMockLogs({ userId }));
  },
};
