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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
};

export const useDeleteUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
};

export const useBanUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.ban(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
};

export const useUnbanUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.unban(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
};

export const useVerifyUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.verify(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
};

export const useUnverifyUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.unverify(id),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "reports"] }),
  });
};

export const useDeleteReport = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reportsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "reports"] }),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "jobs"] }),
  });
};

export const useDeleteJob = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jobsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "jobs"] }),
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
