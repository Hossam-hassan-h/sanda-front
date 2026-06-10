import api, { USE_MOCKS } from "./client";
import { mockDelay } from "@/lib/mock/utils";
import type { Rating, CreateRatingPayload, ApiSuccessResponse } from "./types";
import { mockRatings, mockUsers } from "@/lib/mock/data";

export const ratingsApi = {
  /** List ratings for a specific user */
  async listByUser(userId: string): Promise<Rating[]> {
    if (USE_MOCKS) {
      return mockDelay(mockRatings);
    }
    const { data: body } = await api.get(`/users/${userId}/ratings`);
    const ratings = ((body as Record<string, unknown>).data ?? []) as Record<string, unknown>[];
    return ratings as Rating[];
  },

  /** Create a new rating/review (falls back to mock since backend has no create endpoint) */
  async create(payload: CreateRatingPayload): Promise<Rating> {
    const reviewer = mockUsers.find((u) => u.id === "u2") || mockUsers[1];
    const newRating: Rating = {
      id: "r-" + Date.now(),
      rating: payload.rating,
      comment: payload.comment,
      reviewerId: reviewer.id,
      reviewer: {
        id: reviewer.id,
        name: reviewer.name,
        avatar: reviewer.avatar,
        rating: reviewer.rating,
      },
      reviewedUserId: payload.reviewedUserId,
      createdAt: new Date().toISOString().split("T")[0],
    };
    mockRatings.unshift(newRating);
    return mockDelay(newRating, 500);
  },
};
