import api, { USE_MOCKS } from "@/api/client";
import type { Job } from "@/api/types";
import type { PaginatedResponse, AdminJobsParams } from "../admin-types";
import { mapBackendJob } from "../admin-mappers";
import { mockJobs } from "@/lib/mock/data";

export async function fetchJobs(params?: AdminJobsParams): Promise<PaginatedResponse<Job> | null> {
  if (USE_MOCKS) {
    let result = [...mockJobs];
    if (params?.status) result = result.filter((j) => j.status === params.status);
    if (params?.category) result = result.filter((j) => j.category === params.category);
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 10;
    return { data: result.slice((page - 1) * pageSize, page * pageSize), total: result.length, page, pageSize };
  }
  try {
    const backendParams: Record<string, unknown> = {};
    if (params?.status) backendParams.status = params.status;
    if (params?.category) backendParams.category = params.category;

    const response = await api.get("/admin/jobs", { params: backendParams });
    const body = response.data as { data: Record<string, unknown>[] };
    const rawJobs = body.data as Record<string, unknown>[];

    if (!Array.isArray(rawJobs)) return null;
    const mapped = rawJobs.map(mapBackendJob);

    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 10;
    const total = mapped.length;

    return { data: mapped.slice((page - 1) * pageSize, page * pageSize), total, page, pageSize };
  } catch {
    return null;
  }
}

export async function fetchJobById(id: string): Promise<Job | null> {
  if (USE_MOCKS) return mockJobs.find((j) => j.id === id) ?? null;
  try {
    const response = await api.get(`/jobs/${id}`);
    const raw = response.data as Record<string, unknown>;
    return mapBackendJob(raw);
  } catch {
    return null;
  }
}

export async function updateJob(id: string, payload: Partial<Job>): Promise<Job | null> {
  try {
    const body: Record<string, unknown> = {};
    if (payload.title) body.title = payload.title;
    if (payload.description !== undefined) body.description = payload.description;
    if (payload.category) body.category = payload.category;
    if (payload.city) body.location = payload.city;
    if (payload.address) body.location = payload.address;
    if (payload.price !== undefined) body.salary = payload.price;
    if (payload.hours !== undefined) body.duration = payload.hours;
    if (payload.startDate) body.start_date = payload.startDate;
    if (payload.endDate) body.end_date = payload.endDate;
    if (payload.requiredWorkers !== undefined) body.required_workers = payload.requiredWorkers;
    if (payload.status) body.status = payload.status.replace(/-/g, "_");
    const response = await api.put(`/admin/jobs/${id}`, body);
    const raw = response.data as Record<string, unknown>;
    return mapBackendJob(raw);
  } catch {
    return null;
  }
}

export async function deleteJob(id: string): Promise<{ message: string } | null> {
  try {
    const response = await api.delete(`/admin/jobs/${id}`);
    return response.data as { message: string };
  } catch {
    return null;
  }
}
