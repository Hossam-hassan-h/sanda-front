import type {
  AdminUsersApi,
  AdminJobsApi,
  AdminReportsApi,
  AdminWalletApi,
  AdminChatApi,
  AdminDashboardApi,
} from "./admin-types";

import { fetchUsers, fetchAllUsers, fetchUserById, createUser, fetchJobs, fetchJobById } from "./admin-endpoints";

import {
  mockUsersHandlers,
  mockJobsHandlers,
  mockReportsHandlers,
  mockWalletHandlers,
  mockChatHandlers,
  mockDashboardHandlers,
  richMockUsers,
  richMockJobs,
  richMockReports,
  richMockTransactions,
  richMockConversations,
  richMockUserLogs,
  richMockStats,
} from "./admin-mocks";

/**
 * Composition Root
 *
 * لكل function:
 *   1. لو ليها endpoint في الباك → نحاول الأول، لو فشل نستخدم mock
 *   2. لو مش موجودة في الباك → mock مباشر (zero 404s)
 */

// =============================================================================
// Users
// =============================================================================

export const usersApi: AdminUsersApi = {
  async getAll(params) {
    const result = await fetchUsers(params);
    if (result) return result;
    return mockUsersHandlers.getAll(params);
  },

  async getById(id) {
    const result = await fetchUserById(id);
    if (result) return result;
    return mockUsersHandlers.getById(id);
  },

  async list() {
    const result = await fetchAllUsers();
    if (result) return result;
    return mockUsersHandlers.list();
  },

  async create(payload) {
    const result = await createUser(payload);
    if (result) return result;
    return mockUsersHandlers.create(payload);
  },

  async update(id, payload) {
    return mockUsersHandlers.update(id, payload);
  },

  async delete(id) {
    return mockUsersHandlers.delete(id);
  },

  async ban(id) {
    return mockUsersHandlers.ban(id);
  },

  async unban(id) {
    return mockUsersHandlers.unban(id);
  },

  async verify(id) {
    return mockUsersHandlers.verify(id);
  },

  async unverify(id) {
    return mockUsersHandlers.unverify(id);
  },
};

// =============================================================================
// Jobs
// =============================================================================

export const jobsApi: AdminJobsApi = {
  async getAll(params) {
    const result = await fetchJobs(params);
    if (result) return result;
    return mockJobsHandlers.getAll(params);
  },

  async getById(id) {
    const result = await fetchJobById(id);
    if (result) return result;
    return mockJobsHandlers.getById(id);
  },

  async update(id, payload) {
    return mockJobsHandlers.update(id, payload);
  },

  async delete(id) {
    return mockJobsHandlers.delete(id);
  },
};

// =============================================================================
// Reports — Mock only (لا يوجد endpoint في الباك)
// =============================================================================

export const reportsApi: AdminReportsApi = {
  getAll: (params?) => mockReportsHandlers.getAll(params),
  getById: (id) => mockReportsHandlers.getById(id),
  updateStatus: (id, status) => mockReportsHandlers.updateStatus(id, status),
  delete: (id) => mockReportsHandlers.delete(id),
};

// =============================================================================
// Wallet — Mock only (لا يوجد endpoint في الباك)
// =============================================================================

export const walletApi: AdminWalletApi = {
  getAll: (params?) => mockWalletHandlers.getAll(params),
  getStats: () => mockWalletHandlers.getStats(),
};

// =============================================================================
// Chat — Mock only (لا يوجد endpoint في الباك)
// =============================================================================

export const chatApi: AdminChatApi = {
  getAll: (params?) => mockChatHandlers.getAll(params),
  getById: (id) => mockChatHandlers.getById(id),
};

// =============================================================================
// Dashboard — Mock only (لا يوجد endpoint في الباك)
// =============================================================================

export const dashboardApi: AdminDashboardApi = {
  getStats: () => mockDashboardHandlers.getStats(),
};

// =============================================================================
// Mock Data Exports (للوصول من الخارج لو احتاجها)
// =============================================================================

export {
  richMockUsers,
  richMockJobs,
  richMockReports,
  richMockTransactions,
  richMockConversations,
  richMockUserLogs,
  richMockStats,
};
