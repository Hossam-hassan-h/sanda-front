import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ratingsApi } from "@/api/ratings";
import type { CreateRatingPayload } from "@/api/types";

/** Get all reviews for a user */
export const useUserRatings = (userId: string) =>
  useQuery({
    queryKey: ["ratings", "user", userId],
    queryFn: () => ratingsApi.listByUser(userId),
    enabled: !!userId,
  });

/** Submit a review for a user */
export const useCreateRating = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRatingPayload) => ratingsApi.create(payload),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["ratings", "user", variables.reviewedUserId] });
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
};
