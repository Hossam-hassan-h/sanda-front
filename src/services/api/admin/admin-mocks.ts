import { mockDelay } from "@/lib/mock/utils";
import type { User, Job, Report, WalletTransaction, Conversation, UserLog, AdminStats } from "@/api/types";
import type {
  PaginatedResponse,
  ChatDetail,
  WalletStats,
  AdminUsersParams,
  AdminJobsParams,
  AdminReportsParams,
  AdminWalletParams,
  AdminChatParams,
} from "./admin-types";

import {
  mockUsers as richMockUsers,
  mockJobs as richMockJobs,
  mockReports as richMockReports,
  mockTransactions as richMockTransactions,
  mockConversations as richMockConversations,
  mockUserLogs as richMockUserLogs,
  mockStats as richMockStats,
} from "@/lib/mock/data";

// =============================================================================
// Utility Helpers
// =============================================================================

function paginate<T>(items: T[], page = 1, pageSize = 10): PaginatedResponse<T> {
  return {
    data: items.slice((page - 1) * pageSize, page * pageSize),
    total: items.length,
    page,
    pageSize,
  };
}

function searchFilter<T extends Record<string, unknown>>(
  items: T[],
  search?: string,
  fields: (keyof T)[] = []
): T[] {
  if (!search) return items;
  const q = search.toLowerCase();
  return items.filter((item) =>
    fields.some((field) => {
      const val = item[field];
      return val != null && String(val).toLowerCase().includes(q);
    })
  );
}

// =============================================================================
// Users — Mock-only functions (update, delete, ban, unban, verify, unverify)
// =============================================================================

function mockGetAllUsers(params?: AdminUsersParams): Promise<PaginatedResponse<User>> {
  let items = searchFilter(richMockUsers as unknown as Record<string, unknown>[], params?.search, [
    "name", "phone", "city",
  ]);

  items = items.filter((u) => {
    const user = u as unknown as User;
    if (params?.role && params.role !== "all" && user.role !== params.role) return false;
    if (params?.status === "active" && !user.isActive) return false;
    if (params?.status === "banned" && user.isActive !== false) return false;
    if (params?.status === "verified" && !user.isVerified) return false;
    if (params?.status === "unverified" && user.isVerified) return false;
    if (params?.status === "pending_verification") {
      const vr = (user as { verificationRequest?: { status: string } }).verificationRequest;
      if (user.isVerified || vr?.status !== "pending") return false;
    }
    return true;
  });

  return mockDelay(paginate(items, params?.page || 1, params?.pageSize || 10));
}

function mockGetUserById(id: string): Promise<User> {
  const user = richMockUsers.find((u) => u.id === id);
  if (!user) return Promise.reject(new Error("المستخدم غير موجود"));
  return mockDelay(user);
}

function mockListUsers(): Promise<User[]> {
  return mockDelay([...richMockUsers]);
}

function mockCreateUser(payload: Partial<User>): Promise<User> {
  const newUser: User = {
    id: `u${Date.now()}`,
    name: payload.name || "مستخدم جديد",
    email: payload.email || "user@example.com",
    phone: payload.phone,
    role: payload.role || "worker",
    walletBalance: payload.walletBalance ?? 0,
    isVerified: payload.isVerified ?? false,
    isActive: true,
    city: payload.city,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  richMockUsers.push(newUser);
  return mockDelay(newUser);
}

function mockUpdateUser(id: string, payload: Partial<User>): Promise<User> {
  const idx = richMockUsers.findIndex((u) => u.id === id);
  if (idx === -1) return Promise.reject(new Error("المستخدم غير موجود"));
  const updated = { ...richMockUsers[idx], ...payload, updatedAt: new Date().toISOString() };
  richMockUsers[idx] = updated;
  return mockDelay(updated);
}

function mockDeleteUser(id: string): Promise<{ ok: true }> {
  const idx = richMockUsers.findIndex((u) => u.id === id);
  if (idx !== -1) richMockUsers.splice(idx, 1);
  return mockDelay({ ok: true });
}

function mockBanUser(id: string): Promise<{ ok: true }> {
  const user = richMockUsers.find((u) => u.id === id);
  if (user) user.isActive = false;
  return mockDelay({ ok: true });
}

function mockUnbanUser(id: string): Promise<{ ok: true }> {
  const user = richMockUsers.find((u) => u.id === id);
  if (user) user.isActive = true;
  return mockDelay({ ok: true });
}

function mockVerifyUser(id: string): Promise<{ ok: true }> {
  const user = richMockUsers.find((u) => u.id === id);
  if (user) {
    user.isVerified = true;
    if (user.verificationRequest) {
      user.verificationRequest = {
        ...user.verificationRequest,
        status: "approved",
        reviewedAt: new Date().toISOString(),
        reviewedBy: "admin",
        rejectionReason: undefined,
      };
    }
  }
  return mockDelay({ ok: true });
}

function mockUnverifyUser(id: string): Promise<{ ok: true }> {
  const user = richMockUsers.find((u) => u.id === id);
  if (user) user.isVerified = false;
  return mockDelay({ ok: true });
}

// =============================================================================
// Reports — Mock only (لا يوجد endpoint في الباك)
// =============================================================================

function mockGetAllReports(params?: AdminReportsParams): Promise<PaginatedResponse<Report>> {
  let items = searchFilter(richMockReports as unknown as Record<string, unknown>[], params?.search, ["reason"]);

  items = items.filter((r) => {
    if (params?.status && params.status !== "all" && (r as unknown as Report).status !== params.status) return false;
    return true;
  });

  return mockDelay(paginate(items, params?.page || 1, params?.pageSize || 10));
}

function mockGetReportById(id: string): Promise<Report> {
  const report = richMockReports.find((r) => r.id === id);
  if (!report) return Promise.reject(new Error("البلاغ غير موجود"));
  return mockDelay(report);
}

function mockUpdateReportStatus(id: string, status: "open" | "reviewed" | "closed"): Promise<{ ok: true }> {
  const report = richMockReports.find((r) => r.id === id);
  if (report) report.status = status;
  return mockDelay({ ok: true });
}

function mockDeleteReport(id: string): Promise<{ ok: true }> {
  const idx = richMockReports.findIndex((r) => r.id === id);
  if (idx !== -1) richMockReports.splice(idx, 1);
  return mockDelay({ ok: true });
}

// =============================================================================
// Jobs — Mock-only functions (update, delete)
// =============================================================================

function mockGetAllJobs(params?: AdminJobsParams): Promise<PaginatedResponse<Job>> {
  let items = searchFilter(richMockJobs as unknown as Record<string, unknown>[], params?.search, [
    "title", "category", "city",
  ]);

  items = items.filter((j) => {
    const job = j as unknown as Job;
    if (params?.status && params.status !== "all" && job.status !== params.status) return false;
    if (params?.category && params.category !== "all" && job.category !== params.category) return false;
    return true;
  });

  return mockDelay(paginate(items, params?.page || 1, params?.pageSize || 10));
}

function mockGetJobById(id: string): Promise<Job> {
  const job = richMockJobs.find((j) => j.id === id);
  if (!job) return Promise.reject(new Error("الوظيفة غير موجودة"));
  return mockDelay(job);
}

function mockUpdateJob(id: string, payload: Partial<Job>): Promise<Job> {
  const idx = richMockJobs.findIndex((j) => j.id === id);
  if (idx === -1) return Promise.reject(new Error("الوظيفة غير موجودة"));
  const updated = { ...richMockJobs[idx], ...payload, updatedAt: new Date().toISOString() };
  richMockJobs[idx] = updated;
  return mockDelay(updated);
}

function mockDeleteJob(id: string): Promise<{ ok: true }> {
  const idx = richMockJobs.findIndex((j) => j.id === id);
  if (idx !== -1) richMockJobs.splice(idx, 1);
  return mockDelay({ ok: true });
}

// =============================================================================
// Wallet — Mock only (لا يوجد endpoint في الباك)
// =============================================================================

function mockGetAllWallet(params?: AdminWalletParams): Promise<PaginatedResponse<WalletTransaction>> {
  let items = searchFilter(richMockTransactions as unknown as Record<string, unknown>[], params?.search, ["jobTitle"]);

  items = items.filter((t) => {
    if (params?.type && params.type !== "all" && (t as unknown as WalletTransaction).transactionType !== params.type) return false;
    return true;
  });

  return mockDelay(paginate(items, params?.page || 1, params?.pageSize || 10));
}

function mockGetWalletStats(): Promise<WalletStats> {
  return mockDelay({
    totalDeposits: 48500,
    totalWithdrawals: 12400,
    platformRevenue: 6200,
    currentBalance: 36100,
  });
}

// =============================================================================
// Chat — Mock only (لا يوجد endpoint في الباك)
// =============================================================================

function mockGetAllChats(params?: AdminChatParams): Promise<PaginatedResponse<Conversation>> {
  let items = searchFilter(richMockConversations as unknown as Record<string, unknown>[], params?.search, ["jobTitle"]);

  items = items.filter((c) => {
    if (params?.status && params.status !== "all") {
      if (params.status === "active" && (c as unknown as Conversation).unread === undefined) return true;
      return false;
    }
    return true;
  });

  return mockDelay(paginate(items, params?.page || 1, params?.pageSize || 10));
}

async function mockGetChatById(id: string): Promise<ChatDetail> {
  const conversation = richMockConversations.find((c) => c.id === id);
  if (!conversation) return Promise.reject(new Error("المحادثة غير موجودة"));

  const { mockMessages } = await import("@/lib/mock/data");
  const messages = (mockMessages[id] || []).map((m: { id: string; senderId: string; message: string; createdAt: string }) => ({
    id: m.id,
    senderId: m.senderId,
    senderName:
      m.senderId === "u1" ? "أحمد" :
      m.senderId === "u2" ? "سارة" :
      m.senderId === "u5" ? "مطعم البيت السوري" :
      "مستخدم",
    message: m.message,
    createdAt: m.createdAt,
  }));

  return mockDelay({ conversation, messages });
}

// =============================================================================
// Dashboard — Mock only (لا يوجد endpoint في الباك)
// =============================================================================

function mockGetDashboardStats(): Promise<AdminStats> {
  return mockDelay(richMockStats);
}

// =============================================================================
// Public API — Mock handlers export
// =============================================================================

export const mockUsersHandlers = {
  getAll: mockGetAllUsers,
  getById: mockGetUserById,
  list: mockListUsers,
  create: mockCreateUser,
  update: mockUpdateUser,
  delete: mockDeleteUser,
  ban: mockBanUser,
  unban: mockUnbanUser,
  verify: mockVerifyUser,
  unverify: mockUnverifyUser,
};

export const mockReportsHandlers = {
  getAll: mockGetAllReports,
  getById: mockGetReportById,
  updateStatus: mockUpdateReportStatus,
  delete: mockDeleteReport,
};

export const mockJobsHandlers = {
  getAll: mockGetAllJobs,
  getById: mockGetJobById,
  update: mockUpdateJob,
  delete: mockDeleteJob,
};

export const mockWalletHandlers = {
  getAll: mockGetAllWallet,
  getStats: mockGetWalletStats,
};

export const mockChatHandlers = {
  getAll: mockGetAllChats,
  getById: mockGetChatById,
};

export const mockDashboardHandlers = {
  getStats: mockGetDashboardStats,
};

export {
  richMockUsers,
  richMockJobs,
  richMockReports,
  richMockTransactions,
  richMockConversations,
  richMockUserLogs,
  richMockStats,
};
