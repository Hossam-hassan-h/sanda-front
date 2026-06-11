import api, { USE_MOCKS } from "./client";
import { mockDelay } from "@/lib/mock/utils";
import type { Rating, CreateRatingPayload } from "./types";
import { mockRatings, mockUsers } from "@/lib/mock/data";

const mapRating = (raw: Record<string, unknown>): Rating => {
  const reviewer = raw.reviewer as Record<string, unknown> | undefined;
  const reviewedUser = raw.reviewedUser as Record<string, unknown> | undefined;
  return {
    id: raw.id as string,
    rating: raw.stars as number,
    comment: raw.comment as string,
    reviewerId: reviewer?.id as string ?? (raw.reviewerId as string) ?? "",
    reviewer: reviewer ? {
      id: reviewer.id as string,
      name: reviewer.name as string,
      avatar: ((reviewer.profileImage as Record<string, unknown>)?.url as string) ?? (reviewer.avatar as string),
      rating: reviewer.rating as number,
      ratingsCount: reviewer.ratingsCount as number,
      city: reviewer.city as string,
    } : (raw.reviewer as unknown as Rating["reviewer"]),
    reviewedUserId: reviewedUser?.id as string ?? (raw.reviewedUserId as string) ?? "",
    reviewedUser: reviewedUser ? {
      id: reviewedUser.id as string,
      name: reviewedUser.name as string,
      avatar: ((reviewedUser.profileImage as Record<string, unknown>)?.url as string) ?? (reviewedUser.avatar as string),
      rating: reviewedUser.rating as number,
    } : undefined,
    createdAt: raw.createdAt as string,
  };
};

export const ratingsApi = {
  /** List ratings for a specific user */
  async listByUser(userId: string): Promise<Rating[]> {
    if (USE_MOCKS) {
      return mockDelay(mockRatings);
    }
    const { data: body } = await api.get(`/users/${userId}/ratings`);
    const ratings = ((body as Record<string, unknown>).data ?? []) as Record<string, unknown>[];
    return ratings.map(mapRating);
  },

  /** Create a new rating/review */
  async create(payload: CreateRatingPayload): Promise<Rating> {
    if (USE_MOCKS) {
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
    }
    try {
      const { data: body } = await api.post(`/jobs/${payload.jobId}/ratings`, {
        reviewed_user: payload.reviewedUserId,
        stars: payload.rating,
        comment: payload.comment,
      });
      const raw = ((body as Record<string, unknown>).data ?? body) as Record<string, unknown>;
      return mapRating(raw);
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404 || status === 400) {
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
      }
      throw err;
    }
  },
};
