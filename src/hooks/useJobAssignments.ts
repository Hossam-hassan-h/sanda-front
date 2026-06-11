import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { jobAssignmentsApi } from "@/api/jobAssignments";

/** Get assignments for a specific job */
export const useJobAssignments = (jobId: string) =>
  useQuery({
    queryKey: ["assignments", "job", jobId],
    queryFn: () => jobAssignmentsApi.listByJob(jobId),
    enabled: !!jobId,
  });

/** Get current worker's assignments */
export const useMyAssignments = () =>
  useQuery({
    queryKey: ["assignments", "mine"],
    queryFn: () => jobAssignmentsApi.myAssignments(),
  });

/** Get a single assignment */
export const useAssignment = (id: string) =>
  useQuery({
    queryKey: ["assignments", id],
    queryFn: () => jobAssignmentsApi.get(id),
    enabled: !!id,
  });

/** Generate QR code for a job */
export const useGenerateQR = () =>
  useMutation({
    mutationFn: ({ jobId }: { jobId: string }) => jobAssignmentsApi.generateQR(jobId),
  });

/** Check-in by scanning QR */
export const useCheckIn = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, qrCode }: { jobId: string; qrCode: string }) =>
      jobAssignmentsApi.checkIn(jobId, qrCode),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assignments"] });
      qc.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
};

/** Check-out */
export const useCheckOut = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assignmentId: string) => jobAssignmentsApi.checkOut(assignmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assignments"] });
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
};

/** Mark as no-show */
export const useMarkNoShow = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assignmentId: string) => jobAssignmentsApi.markNoShow(assignmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assignments"] });
    },
  });
};