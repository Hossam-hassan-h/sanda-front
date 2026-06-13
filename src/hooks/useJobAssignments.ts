import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { jobAssignmentsApi } from "@/api/jobAssignments";

/** Get assignments for a specific job */
export const useJobAssignments = (jobId: string) =>
  useQuery({
    queryKey: ["assignments", "job", jobId],
    queryFn: () => jobAssignmentsApi.listByJob(jobId),
    enabled: !!jobId,
    refetchInterval: 15000,
  });

/** Get current worker's assignments */
export const useMyAssignments = () =>
  useQuery({
    queryKey: ["assignments", "mine"],
    queryFn: () => jobAssignmentsApi.myAssignments(),
    refetchInterval: 15000,
  });

/** Get a single assignment */
export const useAssignment = (id: string) =>
  useQuery({
    queryKey: ["assignments", id],
    queryFn: () => jobAssignmentsApi.get(id),
    enabled: !!id,
    refetchInterval: 15000,
  });

/** Generate check-in QR token for an assignment */
export const useGenerateCheckInQR = () =>
  useMutation({
    mutationFn: (assignmentId: string) => jobAssignmentsApi.generateCheckInQR(assignmentId),
  });

/** Generate check-out QR token for an assignment */
export const useGenerateCheckOutQR = () =>
  useMutation({
    mutationFn: (assignmentId: string) => jobAssignmentsApi.generateCheckOutQR(assignmentId),
  });

/** Check-in by scanning QR token */
export const useCheckInWithQR = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ assignmentId, qrToken }: { assignmentId: string; qrToken: string }) =>
      jobAssignmentsApi.checkInWithQR(assignmentId, qrToken),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assignments"] });
      qc.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
};

/** Check-out by scanning QR token */
export const useCheckOutWithQR = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ assignmentId, qrToken }: { assignmentId: string; qrToken: string }) =>
      jobAssignmentsApi.checkOutWithQR(assignmentId, qrToken),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assignments"] });
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
};

/** Check-out (manual — employer marks complete) */
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

/** Refund during active refund window */
export const useRefundAssignment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assignmentId: string) => jobAssignmentsApi.refund(assignmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assignments"] });
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
};
