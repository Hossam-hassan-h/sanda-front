import api from "@/api/client";
import type { User } from "@/api/types";
import type { PaginatedResponse, AdminUsersParams } from "../admin-types";
import { mapBackendUser } from "../admin-mappers";

function stripPagination(params?: AdminUsersParams): Record<string, unknown> {
  if (!params) return {};
  const { page: _p, pageSize: _ps, ...rest } = params;
  return Object.fromEntries(
    Object.entries(rest).filter(([, v]) => v !== undefined && v !== null)
  );
}

export async function fetchUsers(params?: AdminUsersParams): Promise<PaginatedResponse<User> | null> {
  try {
    const backendParams = stripPagination(params);
    const response = await api.get("/users/", { params: backendParams });
    const body = response.data as { data: Record<string, unknown>[] };
    const rawUsers = body.data as Record<string, unknown>[];

    if (!Array.isArray(rawUsers)) return null;

    const mapped = rawUsers.map(mapBackendUser);
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;

    return {
      data: mapped.slice((page - 1) * pageSize, page * pageSize),
      total: mapped.length,
      page,
      pageSize,
    };
  } catch {
    return null;
  }
}

export async function fetchAllUsers(): Promise<User[] | null> {
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
