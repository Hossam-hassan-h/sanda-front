import { mockDelay } from "@/lib/mock/utils";
import type { Report, WalletTransaction, Conversation } from "@/api/types";
import type {
  PaginatedResponse,
  ChatDetail,
  WalletStats,
  AdminReportsParams,
  AdminWalletParams,
  AdminChatParams,
} from "./admin-types";

import {
  mockReports as richMockReports,
  mockTransactions as richMockTransactions,
  mockConversations as richMockConversations,
  mockUserLogs as richMockUserLogs,
} from "@/lib/mock/data";

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
// Reports — Mock only
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
// Wallet — Mock only
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
// Chat — Mock only
// =============================================================================

function mockGetAllChats(params?: AdminChatParams): Promise<PaginatedResponse<Conversation>> {
  let items = searchFilter(richMockConversations as unknown as Record<string, unknown>[], params?.search, ["jobTitle"]);

  items = items.filter((c) => {
    if (params?.status && params.status !== "all") {
      if (params.status === "active") return true;
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
// Public API
// =============================================================================

export const mockReportsHandlers = {
  getAll: mockGetAllReports,
  getById: mockGetReportById,
  updateStatus: mockUpdateReportStatus,
  delete: mockDeleteReport,
};

export const mockWalletHandlers = {
  getAll: mockGetAllWallet,
  getStats: mockGetWalletStats,
};

export const mockChatHandlers = {
  getAll: mockGetAllChats,
  getById: mockGetChatById,
};

export {
  richMockReports,
  richMockTransactions,
  richMockConversations,
  richMockUserLogs,
};
