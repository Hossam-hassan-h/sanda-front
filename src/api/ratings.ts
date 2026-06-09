import api, { USE_MOCKS } from "./client";
import type { Rating, CreateRatingPayload, ApiSuccessResponse } from "./types";
import { mockRatings, mockUsers } from "@/lib/mock/data";

const delay = <T>(value: T, ms = 300) =>
  new Promise<T>((r) => setTimeout(() => r(value), ms));

export const ratingsApi = {
  /** List ratings for a specific user */
  async listByUser(userId: string): Promise<Rating[]> {
    if (USE_MOCKS) {
      // In mock data, filter ratings (normally we would have a reviewedUserId,
      // but mockRatings has reviews for Ahmed u1 by default)
      return delay(mockRatings);
    }
    const { data } = await api.get<Rating[]>(`/users/${userId}/ratings`);
    return data;
  },

  /** Create a new rating/review */
  async create(payload: CreateRatingPayload): Promise<Rating> {
    if (USE_MOCKS) {
      const reviewer = mockUsers.find((u) => u.id === "u2") || mockUsers[1]; // default mock reviewer
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
      return delay(newRating, 500);
    }
    const { data } = await api.post<Rating>("/ratings", payload);
    return data;
  },
};
