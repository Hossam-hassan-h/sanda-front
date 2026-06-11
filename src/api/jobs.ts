import api, { USE_MOCKS } from "./client";
import { mockApplications, mockJobs, mockRatings } from "@/lib/mock/data";
import { mockDelay } from "@/lib/mock/utils";
import type { Application, Job, JobFilters, Rating, UserSummary } from "./types";

const mapOwnerToEmployer = (owner: Record<string, unknown>): UserSummary => ({
  id: owner.id as string,
  name: owner.name as string,
  avatar: (owner.avatar as string) ?? (owner.profileImage as Record<string, unknown>)?.url as string,
  rating: owner.rating as number,
  ratingsCount: owner.ratingsCount as number,
  city: owner.city as string,
});

const mapJob = (raw: Record<string, unknown>): Job => {
  const owner = raw.owner as Record<string, unknown> | undefined;
  return {
    id: raw.id as string,
    title: raw.title as string,
    description: raw.description as string,
    category: (raw.category as string) ?? "",
    city: (raw.location as string) ?? (raw.city as string) ?? "",
    address: (raw.location as string) ?? (raw.address as string) ?? "",
    latitude: raw.latitude as number | undefined,
    longitude: raw.longitude as number | undefined,
    method: raw.method as Job["method"] | undefined,
    price: (raw.salary as number) ?? (raw.price as number) ?? 0,
    hours: (raw.duration as number) ?? (raw.hours as number) ?? 0,
    startDate: (raw.startDate as string) ?? (raw.start_date as string) ?? "",
    endDate: (raw.endDate as string) ?? (raw.end_date as string) ?? undefined,
    requiredWorkers: (raw.requiredWorkers as number) ?? (raw.requiredWorkers as number) ?? 1,
    status: (raw.status as string) === "in_progress" ? ("in-progress" as const) : (raw.status as Job["status"]),
    employerId: owner?.id as string ?? (raw.employerId as string) ?? "",
    employer: owner ? mapOwnerToEmployer(owner) : (raw.employer as UserSummary) ?? { id: "", name: "صاحب العمل" },
    workerId: raw.workerId as string | undefined,
    worker: raw.worker as UserSummary | undefined,
    applicantsCount: (raw.applicantsCount as number) ?? (raw.acceptedWorkersCount as number) ?? 0,
    qrCode: raw.qrCode as string | undefined,
    createdAt: raw.createdAt as string ?? raw.created_at as string,
    updatedAt: raw.updatedAt as string ?? raw.updated_at as string,
  };
};

const mapApplication = (raw: Record<string, unknown>): Application => {
  const job = raw.job as Record<string, unknown> | undefined;
  const worker = raw.worker as Record<string, unknown> | undefined;
  return {
    id: raw.id as string,
    jobId: job?.id as string ?? (raw.jobId as string) ?? "",
    job: job ? { id: job.id as string, title: job.title as string, city: job.city as string ?? "", price: (job.salary as number) ?? (job.price as number) ?? 0 } : undefined,
    workerId: worker?.id as string ?? (raw.workerId as string) ?? "",
    worker: worker ? {
      id: worker.id as string,
      name: worker.name as string,
      avatar: worker.avatar as string,
      rating: worker.rating as number,
      ratingsCount: worker.ratingsCount as number,
      city: worker.city as string,
    } : (raw.worker as unknown as UserSummary) ?? { id: "", name: "" },
    message: raw.message as string,
    status: raw.status as Application["status"],
    createdAt: raw.createdAt as string ?? raw.created_at as string,
    updatedAt: raw.updatedAt as string ?? raw.updated_at as string,
  };
};

export const jobsApi = {
  async list(filters: JobFilters = {}): Promise<Job[]> {
    if (USE_MOCKS) {
      let result = [...mockJobs];
      if (filters.q) result = result.filter((j) => j.title.includes(filters.q!) || j.description.includes(filters.q!));
      if (filters.city && filters.city !== "all") result = result.filter((j) => j.city === filters.city);
      if (filters.category && filters.category !== "all") result = result.filter((j) => j.category === filters.category);
      if (filters.minPrice) result = result.filter((j) => j.price >= filters.minPrice!);
      if (filters.maxPrice) result = result.filter((j) => j.price <= filters.maxPrice!);
      return mockDelay(result);
    }
    const backendParams: Record<string, string | number> = {};
    if (filters.category && filters.category !== "all") backendParams.category = filters.category;
    if (filters.city && filters.city !== "all") backendParams.location = filters.city;
    if (filters.page) backendParams.page = filters.page;
    if (filters.limit) backendParams.limit = filters.limit;
    const { data: body } = await api.get("/jobs", { params: backendParams });
    const jobs = ((body as Record<string, unknown>).data ?? []) as Record<string, unknown>[];
    return jobs.map(mapJob);
  },

  async get(id: string): Promise<Job | undefined> {
    if (USE_MOCKS) return mockDelay(mockJobs.find((j) => j.id === id));
    const { data } = await api.get(`/jobs/${id}`);
    return data ? mapJob(data as Record<string, unknown>) : undefined;
  },

  async myJobs(): Promise<Job[]> {
    if (USE_MOCKS) return mockDelay(mockJobs.filter((j) => j.employerId === "u2"));
    const { data: body } = await api.get("/jobs/my-jobs");
    const jobs = ((body as Record<string, unknown>).data ?? []) as Record<string, unknown>[];
    return jobs.map(mapJob);
  },

  async create(payload: Partial<Job>): Promise<Job> {
    if (USE_MOCKS) {
      const job: Job = {
        id: "j" + Date.now(),
        title: payload.title ?? "",
        description: payload.description ?? "",
        category: payload.category ?? "",
        city: payload.city ?? "",
        address: payload.address ?? "",
        latitude: payload.latitude,
        longitude: payload.longitude,
        method: payload.method,
        price: payload.price ?? 0,
        hours: payload.hours ?? 0,
        startDate: payload.startDate ?? new Date().toISOString(),
        status: "open",
        employerId: "u2",
        employer: { id: "u2", name: "سارة عبدالله", rating: 4.9 },
        applicantsCount: 0,
        createdAt: new Date().toISOString(),
      };
      return mockDelay(job);
    }
    const body: Record<string, unknown> = {
      title: payload.title,
      description: payload.description,
      category: payload.category,
      location: [payload.city, payload.address].filter(Boolean).join(" - "),
      start_date: payload.startDate,
      end_date: payload.endDate,
      duration: payload.hours,
      salary: payload.price,
      required_workers: payload.requiredWorkers ?? 1,
    };
    const { data } = await api.post("/jobs", body);
    return mapJob(data as Record<string, unknown>);
  },

  async update(id: string, payload: Partial<Job>): Promise<Job> {
    if (USE_MOCKS) {
      const existing = mockJobs.find((j) => j.id === id);
      if (!existing) {
        throw new Error("Job not found");
      }
      const updated: Job = {
        ...existing,
        ...payload,
        id: existing.id,
        employerId: existing.employerId,
        employer: existing.employer,
        applicantsCount: existing.applicantsCount,
        createdAt: existing.createdAt,
      };
      Object.assign(existing, updated);
      return mockDelay(updated);
    }
    const body: Record<string, unknown> = {};
    if (payload.title) body.title = payload.title;
    if (payload.description) body.description = payload.description;
    if (payload.category) body.category = payload.category;
    if (payload.city || payload.address) {
      body.location = [payload.city, payload.address].filter(Boolean).join(" - ");
    }
    if (payload.startDate) body.start_date = payload.startDate;
    if (payload.endDate) body.end_date = payload.endDate;
    if (payload.hours) body.duration = payload.hours;
    if (payload.price !== undefined) body.salary = payload.price;
    if (payload.requiredWorkers) body.required_workers = payload.requiredWorkers;
    if (payload.status) body.status = payload.status.replace(/-/g, "_");
    const { data } = await api.put(`/jobs/${id}`, body);
    return mapJob(data as Record<string, unknown>);
  },

  async remove(id: string): Promise<{ ok: true }> {
    if (USE_MOCKS) {
      const idx = mockJobs.findIndex((j) => j.id === id);
      if (idx > -1) mockJobs.splice(idx, 1);
      return mockDelay({ ok: true });
    }
    const { data } = await api.delete<{ ok: true }>(`/jobs/${id}`);
    return data;
  },

  async apply(jobId: string, message: string): Promise<Application> {
    if (USE_MOCKS) {
      return mockDelay({
        id: "a" + Date.now(),
        jobId,
        worker: { id: "u1", name: "أحمد المصري", rating: 4.8, ratingsCount: 32, city: "القاهرة", skills: [] },
        message,
        status: "pending",
        createdAt: new Date().toISOString(),
      });
    }
    const { data } = await api.post(`/jobs/${jobId}/applications`, { message });
    return mapApplication(data as Record<string, unknown>);
  },

  async applicants(jobId: string): Promise<Application[]> {
    if (USE_MOCKS) return mockDelay(mockApplications.filter((a) => a.jobId === jobId));
    const { data: body } = await api.get(`/jobs/${jobId}/applications`);
    const apps = ((body as Record<string, unknown>).data ?? []) as Record<string, unknown>[];
    return apps.map(mapApplication);
  },

  async acceptApplicant(applicationId: string): Promise<{ ok: true }> {
    if (USE_MOCKS) {
      const app = mockApplications.find((a) => a.id === applicationId);
      if (app) {
        app.status = "accepted";
        const job = mockJobs.find((j) => j.id === app.jobId);
        if (job) {
          job.status = "in-progress";
          job.workerId = app.workerId;
          job.worker = app.worker;
        }
      }
      return mockDelay({ ok: true });
    }
    const { data } = await api.patch(`/applications/${applicationId}/accept`);
    return data as { ok: true };
  },

  async rejectApplicant(applicationId: string): Promise<{ ok: true }> {
    if (USE_MOCKS) return mockDelay({ ok: true });
    const { data } = await api.patch(`/applications/${applicationId}/reject`);
    return data as { ok: true };
  },

  async ratings(userId: string): Promise<Rating[]> {
    if (USE_MOCKS) return mockDelay(mockRatings);
    const { data: body } = await api.get(`/users/${userId}/ratings`);
    const ratings = ((body as Record<string, unknown>).data ?? []) as Record<string, unknown>[];
    return ratings as Rating[];
  },

  async myApplications(): Promise<Application[]> {
    if (USE_MOCKS) return mockDelay(mockApplications);
    const { data: body } = await api.get("/applications/me");
    const apps = ((body as Record<string, unknown>).data ?? []) as Record<string, unknown>[];
    return apps.map(mapApplication);
  },
};
