import api, { USE_MOCKS } from "./client";
import { mockApplications, mockJobs, mockRatings } from "@/lib/mock/data";
import { mockDelay } from "@/lib/mock/utils";
import type { Application, Job, JobFilters, Rating } from "./types";

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
    const { data } = await api.get("/jobs", { params: filters });
    return data;
  },

  async get(id: string): Promise<Job | undefined> {
    if (USE_MOCKS) return mockDelay(mockJobs.find((j) => j.id === id));
    const { data } = await api.get(`/jobs/${id}`);
    return data;
  },

  async myJobs(): Promise<Job[]> {
    if (USE_MOCKS) return mockDelay(mockJobs.filter((j) => j.employerId === "u2"));
    const { data } = await api.get("/jobs/mine");
    return data;
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
    const { data } = await api.post("/jobs", payload);
    return data;
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
        // Preserve server-managed fields
        id: existing.id,
        employerId: existing.employerId,
        employer: existing.employer,
        status: existing.status === "open" ? "open" : existing.status,
        applicantsCount: existing.applicantsCount,
        createdAt: existing.createdAt,
      };
      Object.assign(existing, updated);
      return mockDelay(updated);
    }
    const { data } = await api.patch<Job>(`/jobs/${id}`, payload);
    return data;
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
    const { data } = await api.post(`/jobs/${jobId}/apply`, { message });
    return data;
  },

  async applicants(jobId: string): Promise<Application[]> {
    if (USE_MOCKS) return mockDelay(mockApplications.filter((a) => a.jobId === jobId));
    const { data } = await api.get(`/jobs/${jobId}/applicants`);
    return data;
  },

  async acceptApplicant(applicationId: string): Promise<{ ok: true }> {
    if (USE_MOCKS) {
      // Update the application status to accepted
      const app = mockApplications.find((a) => a.id === applicationId);
      if (app) {
        app.status = "accepted";
        // Update the job status to in-progress and set workerId
        const job = mockJobs.find((j) => j.id === app.jobId);
        if (job) {
          job.status = "in-progress";
          job.workerId = app.workerId;
          job.worker = app.worker;
        }
      }
      return mockDelay({ ok: true });
    }
    const { data } = await api.post(`/applications/${applicationId}/accept`);
    return data;
  },

  async rejectApplicant(applicationId: string): Promise<{ ok: true }> {
    if (USE_MOCKS) return mockDelay({ ok: true });
    const { data } = await api.post(`/applications/${applicationId}/reject`);
    return data;
  },

  async ratings(userId: string): Promise<Rating[]> {
    if (USE_MOCKS) return mockDelay(mockRatings);
    const { data } = await api.get(`/users/${userId}/ratings`);
    return data;
  },
};
