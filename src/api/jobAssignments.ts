import api, { USE_MOCKS } from "./client";
import { mockDelay } from "@/lib/mock/utils";
import type { JobAssignment, ApiSuccessResponse, UserSummary } from "./types";

const mapAssignment = (raw: Record<string, unknown>): JobAssignment => {
  const job = raw.job as Record<string, unknown> | undefined;
  const worker = raw.worker as Record<string, unknown> | undefined;
  const employer = raw.employer as Record<string, unknown> | undefined;
  const statusMap: Record<string, JobAssignment["status"]> = {
    assigned: "assigned",
    in_progress: "checked-in",
    completed: "checked-out",
    cancelled: "no-show",
    no_show: "no-show",
  };
  return {
    id: raw.id as string ?? raw._id as string,
    jobId: job?._id as string ?? job?.id as string ?? (raw.jobId as string) ?? "",
    job: job ? { id: job._id as string ?? job.id as string, title: job.title as string, city: (job.location as string) ?? (job.city as string) ?? "", price: (job.salary as number) ?? (job.price as number) ?? 0, status: job.status as string } : (raw.job as unknown as JobAssignment["job"]),
    workerId: typeof worker === "string" ? worker : (worker?._id as string ?? worker?.id as string ?? (raw.workerId as string) ?? ""),
    worker: worker ? (typeof worker === "object" ? { id: worker._id as string ?? worker.id as string, name: worker.name as string, avatar: worker.avatar as string ?? ((worker.profileImage as Record<string, unknown>)?.url as string) ?? (worker.profile_image as Record<string, unknown>)?.url as string, rating: worker.rating as number } : undefined) : (raw.worker as UserSummary),
    checkInTime: (raw.checked_in_at as string) ?? (raw.checkedInAt as string) ?? (raw.startedAt as string) ?? raw.checkInTime as string,
    checkOutTime: (raw.checked_out_at as string) ?? (raw.checkedOutAt as string) ?? (raw.completedAt as string) ?? raw.checkOutTime as string,
    checkedInAt: (raw.checked_in_at as string) ?? (raw.checkedInAt as string) ?? null,
    checkedOutAt: (raw.checked_out_at as string) ?? (raw.checkedOutAt as string) ?? null,
    completedAt: (raw.completed_at as string) ?? (raw.completedAt as string) ?? null,
    refundDeadline: (raw.refund_deadline as string) ?? (raw.refundDeadline as string) ?? null,
    marketplaceStatus: (raw.marketplace_status as JobAssignment["marketplaceStatus"]) ?? (raw.marketplaceStatus as JobAssignment["marketplaceStatus"]),
    payment: typeof raw.payment === "string" ? raw.payment : ((raw.payment as Record<string, unknown> | undefined)?._id as string) ?? ((raw.payment as Record<string, unknown> | undefined)?.id as string) ?? null,
    status: statusMap[raw.status as string] ?? (raw.status as JobAssignment["status"]),
    createdAt: raw.createdAt as string ?? raw.created_at as string,
  };
};

// Mock data for job assignments
const mockAssignments: JobAssignment[] = [
  {
    id: "ja1",
    jobId: "j4",
    job: { id: "j4", title: "مساعد مطبخ بدوام جزئي", city: "القاهرة", price: 250 },
    workerId: "u1",
    worker: { id: "u1", name: "أحمد المصري", avatar: "https://i.pravatar.cc/150?img=12", rating: 4.8 },
    checkInTime: "2026-06-07T17:05:00",
    checkOutTime: "2026-06-07T23:00:00",
    status: "checked-out",
    createdAt: "2026-06-07T17:00:00",
  },
  {
    id: "ja2",
    jobId: "j1",
    job: { id: "j1", title: "نادل لحفل زفاف", city: "القاهرة", price: 600 },
    workerId: "u4",
    worker: { id: "u4", name: "ليلى الشريف", avatar: "https://i.pravatar.cc/150?img=49", rating: 5.0 },
    checkInTime: "2026-06-12T18:10:00",
    status: "checked-in",
    createdAt: "2026-06-12T18:00:00",
  },
  {
    id: "ja3",
    jobId: "j2",
    job: { id: "j2", title: "تركيب أثاث ايكيا", city: "الجيزة", price: 450 },
    workerId: "u1",
    worker: { id: "u1", name: "أحمد المصري", avatar: "https://i.pravatar.cc/150?img=12", rating: 4.8 },
    status: "no-show",
    createdAt: "2026-06-08T10:00:00",
  },
];

export const jobAssignmentsApi = {
  /** Get the current user ID from localStorage */
  getCurrentUserId(): string {
    try {
      const stored = localStorage.getItem("sanda_user");
      if (stored) {
        const user = JSON.parse(stored);
        return user.id || "u1";
      }
    } catch {
      // Ignore parse errors
    }
    return "u1";
  },

  /** Get all assignments for a specific job (for employer) */
  async listByJob(jobId: string): Promise<JobAssignment[]> {
    if (USE_MOCKS) {
      return mockDelay(mockAssignments.filter((a) => a.jobId === jobId));
    }
    const { data: body } = await api.get(`/jobs/${jobId}/assignments`);
    const items = ((body as Record<string, unknown>).data ?? []) as Record<string, unknown>[];
    return items.map(mapAssignment);
  },

  /** Get all assignments for the current worker */
  async myAssignments(): Promise<JobAssignment[]> {
    if (USE_MOCKS) {
      const userId = this.getCurrentUserId();
      return mockDelay(mockAssignments.filter((a) => a.workerId === userId));
    }
    const { data: body } = await api.get("/job-assignments/me");
    const items = ((body as Record<string, unknown>).data ?? []) as Record<string, unknown>[];
    return items.map(mapAssignment);
  },

  /** Get a single assignment by ID */
  async get(id: string): Promise<JobAssignment> {
    try {
      const { data } = await api.get(`/job-assignments/${id}`);
      return mapAssignment((data as Record<string, unknown>).data as Record<string, unknown> ?? data as Record<string, unknown>);
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        const assignment = mockAssignments.find((a) => a.id === id);
        if (!assignment) throw new Error("Assignment not found");
        return mockDelay(assignment);
      }
      throw err;
    }
  },

  /** Generate check-in QR token for an assignment (employer) */
  async generateCheckInQR(assignmentId: string): Promise<{ qrToken: string; type: string; expiresAt: string }> {
    if (USE_MOCKS) {
      const qrData = JSON.stringify({ assignmentId, type: "check_in", timestamp: Date.now(), secret: "sanda-secret" });
      return mockDelay({ qrToken: btoa(qrData), type: "check_in", expiresAt: new Date(Date.now() + 300000).toISOString() });
    }
    const { data: body } = await api.post(`/job-assignments/${assignmentId}/check-in-qr`, {});
    return body as { qrToken: string; type: string; expiresAt: string };
  },

  /** Generate check-out QR token for an assignment (employer) */
  async generateCheckOutQR(assignmentId: string): Promise<{ qrToken: string; type: string; expiresAt: string }> {
    if (USE_MOCKS) {
      const qrData = JSON.stringify({ assignmentId, type: "check_out", timestamp: Date.now(), secret: "sanda-secret" });
      return mockDelay({ qrToken: btoa(qrData), type: "check_out", expiresAt: new Date(Date.now() + 300000).toISOString() });
    }
    const { data: body } = await api.post(`/job-assignments/${assignmentId}/check-out-qr`, {});
    return body as { qrToken: string; type: string; expiresAt: string };
  },

  /** Check-in by scanning QR token (worker) */
  async checkInWithQR(assignmentId: string, qrToken: string, location?: { lat: number; lng: number }): Promise<JobAssignment> {
    if (USE_MOCKS) {
      return mockDelay(mockAssignments[0]);
    }
    const { data: body } = await api.post(`/job-assignments/${assignmentId}/check-in`, { qrToken, location });
    return mapAssignment(body as Record<string, unknown>);
  },

  /** Check-out by scanning QR token (worker) */
  async checkOutWithQR(assignmentId: string, qrToken: string, location?: { lat: number; lng: number }): Promise<JobAssignment> {
    if (USE_MOCKS) {
      return mockDelay(mockAssignments[0]);
    }
    const { data: body } = await api.post(`/job-assignments/${assignmentId}/check-out`, { qrToken, location });
    return mapAssignment(body as Record<string, unknown>);
  },

  /** Complete assignment (employer) — manual check-out */
  async checkOut(assignmentId: string): Promise<JobAssignment> {
    if (USE_MOCKS) {
      const assignment = mockAssignments.find((a) => a.id === assignmentId);
      if (assignment) {
        assignment.checkOutTime = new Date().toISOString();
        assignment.status = "checked-out";
      }
      return mockDelay(assignment!);
    }
    const { data } = await api.patch(`/job-assignments/${assignmentId}/complete`);
    return mapAssignment(data as Record<string, unknown>);
  },

  /** Mark as no-show (employer) */
  async markNoShow(assignmentId: string): Promise<ApiSuccessResponse> {
    try {
      const { data } = await api.patch<ApiSuccessResponse>(`/job-assignments/${assignmentId}/no-show`);
      return data;
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        const assignment = mockAssignments.find((a) => a.id === assignmentId);
        if (assignment) {
          assignment.status = "no-show";
        }
        return mockDelay({ ok: true });
      }
      throw err;
    }
  },

  /** Request refund during the active 30-minute refund window (employer) */
  async refund(assignmentId: string): Promise<JobAssignment> {
    if (USE_MOCKS) {
      const assignment = mockAssignments.find((a) => a.id === assignmentId);
      if (assignment) assignment.status = "no-show";
      return mockDelay(assignment!);
    }
    const { data } = await api.post(`/payments/job-assignments/${assignmentId}/refund`);
    return mapAssignment(data as Record<string, unknown>);
  },
};
