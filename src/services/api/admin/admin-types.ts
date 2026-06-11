import type { User, Job, Report, WalletTransaction, Conversation, AdminStats } from "@/api/types";

// =============================================================================
// Params Interfaces — كل interface فيه بس الـ params اللي محتاجها
// =============================================================================

export interface AdminUsersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  status?: string;
}

export interface AdminJobsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  category?: string;
}

export interface AdminReportsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}

export interface AdminWalletParams {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: string;
}

export interface AdminChatParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}

// =============================================================================
// Response Types
// =============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ChatDetail {
  conversation: Conversation;
  messages: {
    id: string;
    senderId: string;
    senderName: string;
    message: string;
    createdAt: string;
  }[];
}

export interface WalletStats {
  totalDeposits: number;
  totalWithdrawals: number;
  platformRevenue: number;
  currentBalance: number;
}

// =============================================================================
// Admin API Objects — الشكل النهائي لكل API object
// =============================================================================

export interface AdminUsersApi {
  getAll(params?: AdminUsersParams): Promise<PaginatedResponse<User>>;
  getById(id: string): Promise<User>;
  list(): Promise<User[]>;
  create(payload: Partial<User>): Promise<User>;
  update(id: string, payload: Partial<User>): Promise<User>;
  delete(id: string): Promise<{ ok: true }>;
  ban(id: string): Promise<{ ok: true }>;
  unban(id: string): Promise<{ ok: true }>;
  verify(id: string): Promise<{ ok: true }>;
  unverify(id: string): Promise<{ ok: true }>;
}

export interface AdminJobsApi {
  getAll(params?: AdminJobsParams): Promise<PaginatedResponse<Job>>;
  getById(id: string): Promise<Job>;
  update(id: string, payload: Partial<Job>): Promise<Job>;
  delete(id: string): Promise<{ ok: true }>;
}

export interface AdminReportsApi {
  getAll(params?: AdminReportsParams): Promise<PaginatedResponse<Report>>;
  getById(id: string): Promise<Report>;
  updateStatus(id: string, status: "open" | "reviewed" | "closed"): Promise<{ ok: true }>;
  delete(id: string): Promise<{ ok: true }>;
}

export interface AdminWalletApi {
  getAll(params?: AdminWalletParams): Promise<PaginatedResponse<WalletTransaction>>;
  getStats(): Promise<WalletStats>;
}

export interface AdminChatApi {
  getAll(params?: AdminChatParams): Promise<PaginatedResponse<Conversation>>;
  getById(id: string): Promise<ChatDetail>;
}

export interface AdminDashboardApi {
  getStats(): Promise<AdminStats>;
}
