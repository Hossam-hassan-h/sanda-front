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
  };
  return {
    id: raw.id as string,
    jobId: job?.id as string ?? (raw.jobId as string) ?? "",
    job: job ? { id: job.id as string, title: job.title as string, city: (job.location as string) ?? (job.city as string) ?? "", price: (job.salary as number) ?? (job.price as number) ?? 0 } : (raw.job as unknown as JobAssignment["job"]),
    workerId: worker?.id as string ?? (raw.workerId as string) ?? "",
    worker: worker ? { id: worker.id as string, name: worker.name as string, avatar: ((worker.profileImage as Record<string, unknown>)?.url as string) ?? (worker.avatar as string), rating: worker.rating as number } : (raw.worker as UserSummary),
    checkInTime: (raw.checkedInAt as string) ?? (raw.startedAt as string) ?? raw.checkInTime as string,
    checkOutTime: (raw.checkedOutAt as string) ?? (raw.completedAt as string) ?? raw.checkOutTime as string,
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

  /** Generate QR code for a job (employer) — uses mock since backend needs assignment ID */
  async generateQR(jobId: string): Promise<{ qrCode: string; qrData: string }> {
    const qrData = JSON.stringify({ jobId, timestamp: Date.now(), secret: "sanda-secret" });
    return mockDelay({ qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`, qrData });
  },

  /** Check-in by scanning QR code (worker) — uses mock, backend endpoint diverges */
  async checkIn(jobId: string, qrCode: string): Promise<JobAssignment> {
    const userId = this.getCurrentUserId();
    const workerName = (() => {
      try {
        const stored = localStorage.getItem("sanda_user");
        if (stored) {
          const user = JSON.parse(stored);
          return user.name || "أحمد المصري";
        }
      } catch {
        // Ignore parse errors
      }
      return "أحمد المصري";
    })();
    const assignment: JobAssignment = {
      id: "ja-" + Date.now(),
      jobId,
      job: { id: jobId, title: "وظيفة جديدة", city: "القاهرة", price: 0 },
      workerId: userId,
      worker: { id: userId, name: workerName, avatar: "https://i.pravatar.cc/150?img=12", rating: 4.8 },
      checkInTime: new Date().toISOString(),
      status: "checked-in",
      createdAt: new Date().toISOString(),
    };
    mockAssignments.push(assignment);
    return mockDelay(assignment, 800);
  },

  /** Complete assignment (employer) */
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
};