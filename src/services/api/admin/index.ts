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
import type { Conversation, Report } from "@/api/types";

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
  suspendWorker,
  blockWorker,
  restoreWorker,
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
  fetchReports,
  fetchReportById,
  reviewReport,
  updateReportStatus,
  deleteReport,
} from "./endpoints/reports";
import {
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

  async suspend(id, payload) {
    await suspendWorker(id, payload);
    return { ok: true } as const;
  },

  async block(id, payload) {
    await blockWorker(id, payload);
    return { ok: true } as const;
  },

  async restore(id, payload) {
    await restoreWorker(id, payload);
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
  getAll: (params?) => fetchReports(params) as Promise<PaginatedResponse<Report>>,
  getById: (id) => fetchReportById(id) as Promise<Report>,
  updateStatus: (id, status) => updateReportStatus(id, status) as Promise<{ ok: true }>,
  review: (id, payload) => reviewReport(id, payload) as Promise<Report>,
  delete: (id) => deleteReport(id) as Promise<{ ok: true }>,
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
