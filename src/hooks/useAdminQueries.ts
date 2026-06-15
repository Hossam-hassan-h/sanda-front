import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi, reportsApi, jobsApi, walletApi, chatApi, dashboardApi } from "@/services/api";
import type { User, Report, Job, WalletTransaction, Conversation, AdminStats } from "@/api/types";

// ───── Users ─────

export const useUsersQuery = (params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  status?: string;
}) =>
  useQuery({
    queryKey: ["admin", "users", params],
    queryFn: () => usersApi.getAll(params),
  });

export const useUserQuery = (id: string | null) =>
  useQuery({
    queryKey: ["admin", "users", id],
    queryFn: () => usersApi.getById(id!),
    enabled: !!id,
  });

export const useCreateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<User>) => usersApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
};

export const useUpdateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<User> }) => usersApi.update(id, payload),
    onSuccess: (updatedUser) => {
      qc.setQueryData(["admin", "users", updatedUser.id], updatedUser);
      qc.setQueriesData({ queryKey: ["admin", "users"] }, (old: unknown) => {
        if (!old || typeof old !== "object" || !("data" in old) || !Array.isArray((old as Record<string, unknown>).data)) return old;
        const paginated = old as { data: User[] };
        return { ...paginated, data: paginated.data.map((u) => u.id === updatedUser.id ? updatedUser : u) };
      });
    },
  });
};

export const useDeleteUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: (_, id) => {
      qc.removeQueries({ queryKey: ["admin", "users", id] });
      qc.setQueriesData({ queryKey: ["admin", "users"] }, (old: unknown) => {
        if (!old || typeof old !== "object" || !("data" in old) || !Array.isArray((old as Record<string, unknown>).data)) return old;
        const paginated = old as { data: User[]; total: number };
        return { ...paginated, data: paginated.data.filter((u) => u.id !== id), total: paginated.total - 1 };
      });
    },
  });
};

export const useBanUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.ban(id),
    onSuccess: (_, id) => {
      qc.setQueriesData({ queryKey: ["admin", "users"] }, (old: unknown) => {
        if (!old || typeof old !== "object" || !("data" in old) || !Array.isArray((old as Record<string, unknown>).data)) return old;
        const paginated = old as { data: User[] };
        return { ...paginated, data: paginated.data.map((u) => u.id === id ? { ...u, isBlocked: true } : u) };
      });
    },
  });
};

export const useUnbanUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.unban(id),
    onSuccess: (_, id) => {
      qc.setQueriesData({ queryKey: ["admin", "users"] }, (old: unknown) => {
        if (!old || typeof old !== "object" || !("data" in old) || !Array.isArray((old as Record<string, unknown>).data)) return old;
        const paginated = old as { data: User[] };
        return { ...paginated, data: paginated.data.map((u) => u.id === id ? { ...u, isBlocked: false } : u) };
      });
    },
  });
};

export const useVerifyUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.verify(id),
    onSuccess: (_, id) => {
      qc.setQueriesData({ queryKey: ["admin", "users"] }, (old: unknown) => {
        if (!old || typeof old !== "object" || !("data" in old) || !Array.isArray((old as Record<string, unknown>).data)) return old;
        const paginated = old as { data: User[] };
        return { ...paginated, data: paginated.data.map((u) => u.id === id ? { ...u, isVerified: true } : u) };
      });
    },
  });
};

export const useUnverifyUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.unverify(id),
    onSuccess: (_, id) => {
      qc.setQueriesData({ queryKey: ["admin", "users"] }, (old: unknown) => {
        if (!old || typeof old !== "object" || !("data" in old) || !Array.isArray((old as Record<string, unknown>).data)) return old;
        const paginated = old as { data: User[] };
        return { ...paginated, data: paginated.data.map((u) => u.id === id ? { ...u, isVerified: false } : u) };
      });
    },
  });
};

export const useSuspendWorker = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: { reason?: string; suspension_until?: string } }) =>
      usersApi.suspend(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
};

export const useBlockWorker = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: { reason?: string } }) =>
      usersApi.block(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
};

export const useRestoreWorker = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: { reason?: string } }) =>
      usersApi.restore(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
};

// ───── Reports ─────

export const useReportsQuery = (params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}) =>
  useQuery({
    queryKey: ["admin", "reports", params],
    queryFn: () => reportsApi.getAll(params),
  });

export const useReportQuery = (id: string | null) =>
  useQuery({
    queryKey: ["admin", "reports", id],
    queryFn: () => reportsApi.getById(id!),
    enabled: !!id,
  });

export const useUpdateReportStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "open" | "reviewed" | "closed" }) =>
      reportsApi.updateStatus(id, status),
    onSuccess: (_, { id, status }) => {
      qc.setQueriesData({ queryKey: ["admin", "reports"] }, (old: unknown) => {
        if (!old || typeof old !== "object" || !("data" in old) || !Array.isArray((old as Record<string, unknown>).data)) return old;
        const paginated = old as { data: Report[] };
        return { ...paginated, data: paginated.data.map((r) => r.id === id ? { ...r, status } : r) };
      });
    },
  });
};

export const useReviewReport = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision, admin_notes }: { id: string; decision: "approved" | "rejected"; admin_notes?: string }) =>
      reportsApi.review(id, { decision, admin_notes }),
    onSuccess: (report) => {
      qc.setQueryData(["admin", "reports", report.id], report);
      qc.invalidateQueries({ queryKey: ["admin", "reports"] });
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
};

export const useDeleteReport = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reportsApi.delete(id),
    onSuccess: (_, id) => {
      qc.removeQueries({ queryKey: ["admin", "reports", id] });
      qc.setQueriesData({ queryKey: ["admin", "reports"] }, (old: unknown) => {
        if (!old || typeof old !== "object" || !("data" in old) || !Array.isArray((old as Record<string, unknown>).data)) return old;
        const paginated = old as { data: Report[]; total: number };
        return { ...paginated, data: paginated.data.filter((r) => r.id !== id), total: paginated.total - 1 };
      });
    },
  });
};

// ───── Jobs ─────

export const useJobsQuery = (params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  category?: string;
}) =>
  useQuery({
    queryKey: ["admin", "jobs", params],
    queryFn: () => jobsApi.getAll(params),
  });

export const useJobQuery = (id: string | null) =>
  useQuery({
    queryKey: ["admin", "jobs", id],
    queryFn: () => jobsApi.getById(id!),
    enabled: !!id,
  });

export const useUpdateJob = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Job> }) => jobsApi.update(id, payload),
    onSuccess: (updatedJob) => {
      qc.setQueryData(["admin", "jobs", updatedJob.id], updatedJob);
      qc.setQueriesData({ queryKey: ["admin", "jobs"] }, (old: unknown) => {
        if (!old || typeof old !== "object" || !("data" in old) || !Array.isArray((old as Record<string, unknown>).data)) return old;
        const paginated = old as { data: Job[] };
        return { ...paginated, data: paginated.data.map((j) => j.id === updatedJob.id ? updatedJob : j) };
      });
    },
  });
};

export const useDeleteJob = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jobsApi.delete(id),
    onSuccess: (_, id) => {
      qc.removeQueries({ queryKey: ["admin", "jobs", id] });
      qc.setQueriesData({ queryKey: ["admin", "jobs"] }, (old: unknown) => {
        if (!old || typeof old !== "object" || !("data" in old) || !Array.isArray((old as Record<string, unknown>).data)) return old;
        const paginated = old as { data: Job[]; total: number };
        return { ...paginated, data: paginated.data.filter((j) => j.id !== id), total: paginated.total - 1 };
      });
    },
  });
};

// ───── Wallet ─────

export const useWalletTransactionsQuery = (params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: string;
}) =>
  useQuery({
    queryKey: ["admin", "wallet", params],
    queryFn: () => walletApi.getAll(params),
  });

export const useWalletStatsQuery = () =>
  useQuery({
    queryKey: ["admin", "wallet", "stats"],
    queryFn: () => walletApi.getStats(),
  });

// ───── Chat ─────

export const useChatConversationsQuery = (params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}) =>
  useQuery({
    queryKey: ["admin", "chat", params],
    queryFn: () => chatApi.getAll(params),
  });

export const useChatConversationQuery = (id: string | null) =>
  useQuery({
    queryKey: ["admin", "chat", id],
    queryFn: () => chatApi.getById(id!),
    enabled: !!id,
  });

// ───── Dashboard ─────

export const useDashboardStatsQuery = () =>
  useQuery({
    queryKey: ["admin", "dashboard", "stats"],
    queryFn: () => dashboardApi.getStats(),
  });
