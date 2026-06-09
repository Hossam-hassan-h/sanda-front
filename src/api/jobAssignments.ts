import api, { USE_MOCKS } from "./client";
import type { JobAssignment, ApiSuccessResponse } from "./types";

const delay = <T>(value: T, ms = 300) =>
  new Promise<T>((r) => setTimeout(() => r(value), ms));

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
  /** Get all assignments for a specific job (for employer) */
  async listByJob(jobId: string): Promise<JobAssignment[]> {
    if (USE_MOCKS) {
      return delay(mockAssignments.filter((a) => a.jobId === jobId));
    }
    const { data } = await api.get<JobAssignment[]>(`/jobs/${jobId}/assignments`);
    return data;
  },

  /** Get all assignments for the current worker */
  async myAssignments(): Promise<JobAssignment[]> {
    if (USE_MOCKS) {
      return delay(mockAssignments.filter((a) => a.workerId === "u1"));
    }
    const { data } = await api.get<JobAssignment[]>("/assignments/mine");
    return data;
  },

  /** Get a single assignment by ID */
  async get(id: string): Promise<JobAssignment> {
    if (USE_MOCKS) {
      const assignment = mockAssignments.find((a) => a.id === id);
      if (!assignment) throw new Error("Assignment not found");
      return delay(assignment);
    }
    const { data } = await api.get<JobAssignment>(`/assignments/${id}`);
    return data;
  },

  /** Generate QR code for a job (employer) */
  async generateQR(jobId: string): Promise<{ qrCode: string; qrData: string }> {
    if (USE_MOCKS) {
      const qrData = JSON.stringify({ jobId, timestamp: Date.now(), secret: "sanda-secret" });
      return delay({ qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`, qrData });
    }
    const { data } = await api.post<{ qrCode: string; qrData: string }>(`/jobs/${jobId}/qr`);
    return data;
  },

  /** Check-in by scanning QR code (worker) */
  async checkIn(jobId: string, qrCode: string): Promise<JobAssignment> {
    if (USE_MOCKS) {
      const assignment: JobAssignment = {
        id: "ja-" + Date.now(),
        jobId,
        job: { id: jobId, title: "وظيفة جديدة", city: "القاهرة", price: 0 },
        workerId: "u1",
        worker: { id: "u1", name: "أحمد المصري", avatar: "https://i.pravatar.cc/150?img=12", rating: 4.8 },
        checkInTime: new Date().toISOString(),
        status: "checked-in",
        createdAt: new Date().toISOString(),
      };
      mockAssignments.push(assignment);
      return delay(assignment, 800);
    }
    const { data } = await api.post<JobAssignment>("/assignments/check-in", { jobId, qrCode });
    return data;
  },

  /** Check-out (worker or employer) */
  async checkOut(assignmentId: string): Promise<JobAssignment> {
    if (USE_MOCKS) {
      const assignment = mockAssignments.find((a) => a.id === assignmentId);
      if (assignment) {
        assignment.checkOutTime = new Date().toISOString();
        assignment.status = "checked-out";
      }
      return delay(assignment!);
    }
    const { data } = await api.post<JobAssignment>(`/assignments/${assignmentId}/check-out`);
    return data;
  },

  /** Mark as no-show (employer) */
  async markNoShow(assignmentId: string): Promise<ApiSuccessResponse> {
    if (USE_MOCKS) {
      const assignment = mockAssignments.find((a) => a.id === assignmentId);
      if (assignment) {
        assignment.status = "no-show";
      }
      return delay({ ok: true });
    }
    const { data } = await api.post<ApiSuccessResponse>(`/assignments/${assignmentId}/no-show`);
    return data;
  },
};