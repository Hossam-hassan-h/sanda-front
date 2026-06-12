import type {
  AdminUsersApi,
  AdminJobsApi,
  AdminReportsApi,
  AdminWalletApi,
  AdminChatApi,
  AdminDashboardApi,
  PaginatedResponse,
  ChatDetail,
} from "./admin-types";
import type { Conversation } from "@/api/types";

import {
  fetchUsers,
  fetchAllUsers,
  fetchUserById,
  createUser,
  updateUser,
  deleteUser,
  banUser,
  unbanUser,
  verifyUser,
  unverifyUser,
} from "./endpoints/users";

import {
  fetchJobs,
  fetchJobById,
  updateJob,
  deleteJob as deleteJobEndpoint,
} from "./endpoints/jobs";

import { fetchDashboardStats } from "./endpoints/dashboard";
import { fetchChats, fetchChatById } from "./endpoints/chat";

import {
  mockReportsHandlers,
  mockWalletHandlers,
  richMockReports,
  richMockTransactions,
  richMockConversations,
  richMockUserLogs,
} from "./admin-mocks";

export const usersApi: AdminUsersApi = {
  async getAll(params) {
    return fetchUsers(params);
  },

  async getById(id) {
    return fetchUserById(id);
  },

  async list() {
    return fetchAllUsers();
  },

  async create(payload) {
    return createUser(payload);
  },

  async update(id, payload) {
    return updateUser(id, payload);
  },

  async delete(id) {
    await deleteUser(id);
    return { ok: true } as const;
  },

  async ban(id) {
    await banUser(id);
    return { ok: true } as const;
  },

  async unban(id) {
    await unbanUser(id);
    return { ok: true } as const;
  },

  async verify(id) {
    await verifyUser(id);
    return { ok: true } as const;
  },

  async unverify(id) {
    await unverifyUser(id);
    return { ok: true } as const;
  },
};

export const jobsApi: AdminJobsApi = {
  async getAll(params) {
    return fetchJobs(params);
  },

  async getById(id) {
    return fetchJobById(id);
  },

  async update(id, payload) {
    return updateJob(id, payload);
  },

  async delete(id) {
    await deleteJobEndpoint(id);
    return { ok: true } as const;
  },
};

export const reportsApi: AdminReportsApi = {
  getAll: (params?) => mockReportsHandlers.getAll(params),
  getById: (id) => mockReportsHandlers.getById(id),
  updateStatus: (id, status) => mockReportsHandlers.updateStatus(id, status),
  delete: (id) => mockReportsHandlers.delete(id),
};

export const walletApi: AdminWalletApi = {
  getAll: (params?) => mockWalletHandlers.getAll(params),
  getStats: () => mockWalletHandlers.getStats(),
};

export const chatApi: AdminChatApi = {
  getAll: (params?) => fetchChats(params) as Promise<PaginatedResponse<Conversation>>,
  getById: (id) => fetchChatById(id) as Promise<ChatDetail>,
};

export const dashboardApi: AdminDashboardApi = {
  async getStats() {
    return fetchDashboardStats();
  },
};

export {
  richMockReports,
  richMockTransactions,
  richMockConversations,
  richMockUserLogs,
};
