import api from "@/api/client";
import type { User, Job } from "@/api/types";
import type { PaginatedResponse, AdminUsersParams, AdminJobsParams } from "./admin-types";
import { mapBackendUser, mapBackendJob } from "./admin-mappers";

/**
 * Endpoints: functions بتستدعي الباك مباشرة
 * كل function بتعمل try/catch وترجع null لو الباك مش شغال
 * الكود اللي بيستدعيها هو اللي بيقرر يعمل fallback للموك
 *
 * ملاحظة: مش بنبعت page/pageSize للباك عشان User.find() بتاخد req.query كـ filter
 * فـ page=1 بيبقي filter {page: "1"} ومبيقفلش حاجة
 */

// =============================================================================
// Users
// =============================================================================

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

// =============================================================================
// Jobs
// =============================================================================

export async function fetchJobs(params?: AdminJobsParams): Promise<PaginatedResponse<Job> | null> {
  try {
    const backendParams: Record<string, unknown> = {};
    if (params?.page) backendParams.page = params.page;
    if (params?.pageSize) backendParams.limit = params.pageSize; // backend uses 'limit'
    if (params?.category) backendParams.category = params.category;
    // ملاحظة: الـ public endpoint /api/jobs بيقبل بس status: "open"
    // لو عايز نشوف كل الحالات، مش بنبعت status خالص

    const response = await api.get("/jobs", { params: backendParams });
    const body = response.data as {
      data: Record<string, unknown>[];
      pagination?: { page: number; limit: number; total: number };
    };
    const rawJobs = body.data as Record<string, unknown>[];
    const pagination = body.pagination;

    if (!Array.isArray(rawJobs)) return null;
    const mapped = rawJobs.map(mapBackendJob);
    const page = pagination?.page ?? params?.page ?? 1;
    const pageSize = pagination?.limit ?? params?.pageSize ?? 10;
    const total = pagination?.total ?? mapped.length;

    return { data: mapped, total, page, pageSize };
  } catch {
    return null;
  }
}

export async function fetchJobById(id: string): Promise<Job | null> {
  try {
    const response = await api.get(`/jobs/${id}`);
    const raw = response.data as Record<string, unknown>;
    return mapBackendJob(raw);
  } catch {
    return null;
  }
}
