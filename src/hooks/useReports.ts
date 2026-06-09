import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reportsApi } from "@/api/reports";
import type { CreateReportPayload, Report } from "@/api/types";

export const useMyReports = () =>
  useQuery({ queryKey: ["reports", "mine"], queryFn: () => reportsApi.mine() });

export const useCreateReport = () => {
  const qc = useQueryClient();
  return useMutation<Report, Error, CreateReportPayload>({
    mutationFn: (payload) => reportsApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reports"] });
      qc.invalidateQueries({ queryKey: ["admin", "reports"] });
    },
  });
};

export const useUpdateReportStatus = () => {
  const qc = useQueryClient();
  return useMutation<
    { ok: true },
    Error,
    { id: string; status: Report["status"] }
  >({
    mutationFn: ({ id, status }) => reportsApi.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reports"] });
      qc.invalidateQueries({ queryKey: ["admin", "reports"] });
    },
  });
};
