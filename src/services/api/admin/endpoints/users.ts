import api, { USE_MOCKS } from "@/api/client";
import type { User } from "@/api/types";
import type { PaginatedResponse, AdminUsersParams } from "../admin-types";
import { mapBackendUser } from "../admin-mappers";
import { mockUsers } from "@/lib/mock/data";
import { compactParams, normalizePaginatedResponse } from "./utils";

function filterMockUsers(params?: AdminUsersParams): User[] {
  let result = [...mockUsers] as User[];
  if (params?.search) {
    const q = params.search.toLowerCase();
    result = result.filter((u) => u.name.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
  }
  if (params?.role) result = result.filter((u) => u.role === params.role);
  if (params?.status === "active") result = result.filter((u) => u.isBlocked !== true);
  if (params?.status === "banned") result = result.filter((u) => u.isBlocked === true);
  return result;
}

export async function fetchUsers(params?: AdminUsersParams): Promise<PaginatedResponse<User> | null> {
  if (USE_MOCKS) {
    const filtered = filterMockUsers(params);
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;
    return {
      data: filtered.slice((page - 1) * pageSize, page * pageSize),
      total: filtered.length,
      page,
      pageSize,
    };
  }
  try {
    const response = await api.get("/admin/users", { params: compactParams(params) });
    const normalized = normalizePaginatedResponse<Record<string, unknown>>(
      response.data as { data?: Record<string, unknown>[] },
      { page: params?.page, pageSize: params?.pageSize },
    );

    return {
      ...normalized,
      data: normalized.data.map(mapBackendUser),
    };
  } catch {
    return null;
  }
}

export async function fetchAllUsers(): Promise<User[] | null> {
  if (USE_MOCKS) return filterMockUsers();
  try {
    const response = await api.get("/users/");
    const body = response.data as { data: Record<string, unknown>[] };
    const rawUsers = body.data as Record<string, unknown>[];

    if (!Array.isArray(rawUsers)) return null;
    return rawUsers.map(mapBackendUser);
  } catch {
    return null;
  }
}

export async function fetchUserById(id: string): Promise<User | null> {
  if (USE_MOCKS) return (mockUsers as User[]).find((u) => u.id === id) ?? null;
  try {
    const response = await api.get(`/users/profile/${id}`);
    const raw = response.data as Record<string, unknown>;
    return mapBackendUser(raw);
  } catch {
    return null;
  }
}

export async function createUser(payload: Partial<User>): Promise<User | null> {
  try {
    const response = await api.post("/users/", payload);
    const raw = response.data as Record<string, unknown>;
    return mapBackendUser(raw);
  } catch {
    return null;
  }
}

export async function updateUser(id: string, payload: Partial<User>): Promise<User | null> {
  try {
    const response = await api.put(`/admin/users/${id}`, payload);
    const raw = response.data as Record<string, unknown>;
    return mapBackendUser(raw);
  } catch {
    return null;
  }
}

export async function deleteUser(id: string): Promise<{ message: string } | null> {
  try {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data as { message: string };
  } catch {
    return null;
  }
}

export async function banUser(id: string): Promise<User | null> {
  try {
    const response = await api.patch(`/admin/users/${id}/ban`);
    const raw = response.data as Record<string, unknown>;
    return mapBackendUser(raw);
  } catch {
    return null;
  }
}

export async function unbanUser(id: string): Promise<User | null> {
  try {
    const response = await api.patch(`/admin/users/${id}/unban`);
    const raw = response.data as Record<string, unknown>;
    return mapBackendUser(raw);
  } catch {
    return null;
  }
}

export async function verifyUser(id: string): Promise<User | null> {
  try {
    const response = await api.patch(`/admin/users/${id}/verify`);
    const raw = response.data as Record<string, unknown>;
    return mapBackendUser(raw);
  } catch {
    return null;
  }
}

export async function unverifyUser(id: string): Promise<User | null> {
  try {
    const response = await api.patch(`/admin/users/${id}/unverify`);
    const raw = response.data as Record<string, unknown>;
    return mapBackendUser(raw);
  } catch {
    return null;
  }
}

export async function suspendWorker(id: string, payload: { reason?: string; suspension_until?: string } = {}): Promise<User | null> {
  try {
    const response = await api.patch(`/admin/users/${id}/suspend`, payload);
    const raw = response.data as Record<string, unknown>;
    return mapBackendUser(raw);
  } catch {
    return null;
  }
}

export async function blockWorker(id: string, payload: { reason?: string } = {}): Promise<User | null> {
  try {
    const response = await api.patch(`/admin/users/${id}/block`, payload);
    const raw = response.data as Record<string, unknown>;
    return mapBackendUser(raw);
  } catch {
    return null;
  }
}

export async function restoreWorker(id: string, payload: { reason?: string } = {}): Promise<User | null> {
  try {
    const response = await api.patch(`/admin/users/${id}/restore`, payload);
    const raw = response.data as Record<string, unknown>;
    return mapBackendUser(raw);
  } catch {
    return null;
  }
}
