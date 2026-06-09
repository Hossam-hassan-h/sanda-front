import api, { USE_MOCKS } from "@/api/client";
import { mockDelay } from "@/lib/mock/utils";
import type { User, Report, Job, WalletTransaction, Conversation, UserLog, AdminStats } from "@/api/types";
import {
  mockUsers as richMockUsers,
  mockJobs as richMockJobs,
  mockReports as richMockReports,
  mockTransactions as richMockTransactions,
  mockConversations as richMockConversations,
  mockUserLogs as richMockUserLogs,
  mockStats as richMockStats,
} from "@/lib/mock/data";

const createMockPaginatedResponse = <T>(items: T[], page: number, pageSize: number) => ({
  data: items.slice((page - 1) * pageSize, page * pageSize),
  total: items.length,
  page,
  pageSize,
});

const applySearchFilter = <T extends Record<string, unknown>>(
  items: T[],
  search?: string,
  fields: (keyof T)[] = []
): T[] => {
  if (!search) return items;
  const q = search.toLowerCase();
  return items.filter((item) =>
    fields.some((field) => {
      const val = item[field];
      return val != null && String(val).toLowerCase().includes(q);
    })
  );
};

export const usersApi = {
  async getAll(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    role?: string;
    status?: string;
  }): Promise<{ data: User[]; total: number; page: number; pageSize: number }> {
    if (USE_MOCKS) {
      const items = applySearchFilter(richMockUsers as unknown as Record<string, unknown>[], params?.search, [
        "name", "phone", "city",
      ]);
      const filtered = items.filter((u) => {
        const u2 = u as unknown as User;
        if (params?.role && params.role !== "all" && u2.role !== params.role) return false;
        if (params?.status === "active" && !u2.isActive) return false;
        if (params?.status === "banned" && u2.isActive !== false) return false;
        if (params?.status === "verified" && !u2.isVerified) return false;
        if (params?.status === "unverified" && u2.isVerified) return false;
        return true;
      });
      return mockDelay(createMockPaginatedResponse(filtered, params?.page || 1, params?.pageSize || 10));
    }
    const { data } = await api.get("/admin/users", { params });
    return data;
  },

  async getById(id: string): Promise<User> {
    if (USE_MOCKS) {
      const user = richMockUsers.find((u) => u.id === id);
      if (!user) throw new Error("المستخدم غير موجود");
      return mockDelay(user);
    }
    const { data } = await api.get(`/admin/users/${id}`);
    return data;
  },

  async create(payload: Partial<User>): Promise<User> {
    if (USE_MOCKS) {
      const newUser: User = {
        id: `u${Date.now()}`,
        name: payload.name || "مستخدم جديد",
        phone: payload.phone || "01000000000",
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
    const { data } = await api.post("/admin/users", payload);
    return data;
  },

  async update(id: string, payload: Partial<User>): Promise<User> {
    if (USE_MOCKS) {
      const idx = richMockUsers.findIndex((u) => u.id === id);
      if (idx === -1) throw new Error("المستخدم غير موجود");
      const updated = { ...richMockUsers[idx], ...payload, updatedAt: new Date().toISOString() };
      richMockUsers[idx] = updated;
      return mockDelay(updated);
    }
    const { data } = await api.patch(`/admin/users/${id}`, payload);
    return data;
  },

  async delete(id: string): Promise<{ ok: true }> {
    if (USE_MOCKS) {
      const idx = richMockUsers.findIndex((u) => u.id === id);
      if (idx !== -1) richMockUsers.splice(idx, 1);
      return mockDelay({ ok: true });
    }
    const { data } = await api.delete(`/admin/users/${id}`);
    return data;
  },

  async ban(id: string): Promise<{ ok: true }> {
    if (USE_MOCKS) {
      const user = richMockUsers.find((u) => u.id === id);
      if (user) user.isActive = false;
      return mockDelay({ ok: true });
    }
    const { data } = await api.post(`/admin/users/${id}/ban`);
    return data;
  },

  async unban(id: string): Promise<{ ok: true }> {
    if (USE_MOCKS) {
      const user = richMockUsers.find((u) => u.id === id);
      if (user) user.isActive = true;
      return mockDelay({ ok: true });
    }
    const { data } = await api.post(`/admin/users/${id}/unban`);
    return data;
  },

  async verify(id: string): Promise<{ ok: true }> {
    if (USE_MOCKS) {
      const user = richMockUsers.find((u) => u.id === id);
      if (user) user.isVerified = true;
      return mockDelay({ ok: true });
    }
    const { data } = await api.post(`/admin/users/${id}/verify`);
    return data;
  },

  async unverify(id: string): Promise<{ ok: true }> {
    if (USE_MOCKS) {
      const user = richMockUsers.find((u) => u.id === id);
      if (user) user.isVerified = false;
      return mockDelay({ ok: true });
    }
    const { data } = await api.post(`/admin/users/${id}/unverify`);
    return data;
  },
};

export const reportsApi = {
  async getAll(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
  }): Promise<{ data: Report[]; total: number; page: number; pageSize: number }> {
    if (USE_MOCKS) {
      const items = applySearchFilter(richMockReports as unknown as Record<string, unknown>[], params?.search, [
        "reason",
      ]);
      const filtered = items.filter((r) => {
        const r2 = r as unknown as Report;
        if (params?.status && params.status !== "all" && r2.status !== params.status) return false;
        return true;
      });
      return mockDelay(createMockPaginatedResponse(filtered, params?.page || 1, params?.pageSize || 10));
    }
    const { data } = await api.get("/admin/reports", { params });
    return data;
  },

  async getById(id: string): Promise<Report> {
    if (USE_MOCKS) {
      const report = richMockReports.find((r) => r.id === id);
      if (!report) throw new Error("البلاغ غير موجود");
      return mockDelay(report);
    }
    const { data } = await api.get(`/admin/reports/${id}`);
    return data;
  },

  async updateStatus(id: string, status: "open" | "reviewed" | "closed"): Promise<{ ok: true }> {
    if (USE_MOCKS) {
      const report = richMockReports.find((r) => r.id === id);
      if (report) report.status = status;
      return mockDelay({ ok: true });
    }
    const { data } = await api.patch(`/admin/reports/${id}/status`, { status });
    return data;
  },

  async delete(id: string): Promise<{ ok: true }> {
    if (USE_MOCKS) {
      const idx = richMockReports.findIndex((r) => r.id === id);
      if (idx !== -1) richMockReports.splice(idx, 1);
      return mockDelay({ ok: true });
    }
    const { data } = await api.delete(`/admin/reports/${id}`);
    return data;
  },
};

export const jobsApi = {
  async getAll(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    category?: string;
  }): Promise<{ data: Job[]; total: number; page: number; pageSize: number }> {
    if (USE_MOCKS) {
      const items = applySearchFilter(richMockJobs as unknown as Record<string, unknown>[], params?.search, [
        "title", "category", "city",
      ]);
      const filtered = items.filter((j) => {
        const j2 = j as unknown as Job;
        if (params?.status && params.status !== "all" && j2.status !== params.status) return false;
        if (params?.category && params.category !== "all" && j2.category !== params.category) return false;
        return true;
      });
      return mockDelay(createMockPaginatedResponse(filtered, params?.page || 1, params?.pageSize || 10));
    }
    const { data } = await api.get("/admin/jobs", { params });
    return data;
  },

  async getById(id: string): Promise<Job> {
    if (USE_MOCKS) {
      const job = richMockJobs.find((j) => j.id === id);
      if (!job) throw new Error("الوظيفة غير موجودة");
      return mockDelay(job);
    }
    const { data } = await api.get(`/admin/jobs/${id}`);
    return data;
  },

  async update(id: string, payload: Partial<Job>): Promise<Job> {
    if (USE_MOCKS) {
      const idx = richMockJobs.findIndex((j) => j.id === id);
      if (idx === -1) throw new Error("الوظيفة غير موجودة");
      const updated = { ...richMockJobs[idx], ...payload, updatedAt: new Date().toISOString() };
      richMockJobs[idx] = updated;
      return mockDelay(updated);
    }
    const { data } = await api.patch(`/admin/jobs/${id}`, payload);
    return data;
  },

  async delete(id: string): Promise<{ ok: true }> {
    if (USE_MOCKS) {
      const idx = richMockJobs.findIndex((j) => j.id === id);
      if (idx !== -1) richMockJobs.splice(idx, 1);
      return mockDelay({ ok: true });
    }
    const { data } = await api.delete(`/admin/jobs/${id}`);
    return data;
  },
};

export const walletApi = {
  async getAll(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    type?: string;
  }): Promise<{ data: WalletTransaction[]; total: number; page: number; pageSize: number }> {
    if (USE_MOCKS) {
      const items = applySearchFilter(richMockTransactions as unknown as Record<string, unknown>[], params?.search, [
        "jobTitle",
      ]);
      const filtered = items.filter((t) => {
        const t2 = t as unknown as WalletTransaction;
        if (params?.type && params.type !== "all" && t2.transactionType !== params.type) return false;
        return true;
      });
      return mockDelay(createMockPaginatedResponse(filtered, params?.page || 1, params?.pageSize || 10));
    }
    const { data } = await api.get("/admin/wallet", { params });
    return data;
  },

  async getStats(): Promise<{
    totalDeposits: number;
    totalWithdrawals: number;
    platformRevenue: number;
    currentBalance: number;
  }> {
    if (USE_MOCKS) {
      const stats = {
        totalDeposits: 48500,
        totalWithdrawals: 12400,
        platformRevenue: 6200,
        currentBalance: 36100,
      };
      return mockDelay(stats);
    }
    const { data } = await api.get("/admin/wallet/stats");
    return data;
  },
};

export const chatApi = {
  async getAll(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
  }): Promise<{ data: Conversation[]; total: number; page: number; pageSize: number }> {
    if (USE_MOCKS) {
      const items = applySearchFilter(richMockConversations as unknown as Record<string, unknown>[], params?.search, [
        "jobTitle",
      ]);
      const filtered = items.filter((c) => {
        const c2 = c as unknown as Conversation;
        if (params?.status && params.status !== "all") {
          if (params.status === "active" && c2.unread === undefined) return true;
          return false;
        }
        return true;
      });
      return mockDelay(createMockPaginatedResponse(filtered, params?.page || 1, params?.pageSize || 10));
    }
    const { data } = await api.get("/admin/chat", { params });
    return data;
  },

  async getById(id: string): Promise<{
    conversation: Conversation;
    messages: { id: string; senderId: string; senderName: string; message: string; createdAt: string }[];
  }> {
    if (USE_MOCKS) {
      const conversation = richMockConversations.find((c) => c.id === id);
      if (!conversation) throw new Error("المحادثة غير موجودة");
      const { mockMessages } = await import("@/lib/mock/data");
      const messages = (mockMessages[id] || []).map((m) => ({
        id: m.id,
        senderId: m.senderId,
        senderName: m.senderId === "u1" ? "أحمد" : m.senderId === "u2" ? "سارة" : m.senderId === "u5" ? "مطعم البيت السوري" : "مستخدم",
        message: m.message,
        createdAt: m.createdAt,
      }));
      return mockDelay({ conversation, messages });
    }
    const { data } = await api.get(`/admin/chat/${id}`);
    return data;
  },
};

export const dashboardApi = {
  async getStats(): Promise<AdminStats> {
    if (USE_MOCKS) return mockDelay(richMockStats);
    const { data } = await api.get("/admin/stats");
    return data;
  },
};

export { richMockUsers, richMockJobs, richMockReports, richMockTransactions, richMockConversations, richMockUserLogs, richMockStats };
