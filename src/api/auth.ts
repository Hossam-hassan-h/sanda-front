import api, { USE_MOCKS } from "./client";
import { mockUsers } from "@/lib/mock/data";
import { mockDelay } from "@/lib/mock/utils";
import type { User, UserRole } from "./types";

export interface LoginPayload { phone: string; password: string; role?: UserRole }
export interface RegisterPayload extends LoginPayload { name: string; email?: string; role: UserRole }

export const authApi = {
  async login(payload: LoginPayload): Promise<{ user: User; token: string }> {
    if (USE_MOCKS) {
      const user = mockUsers.find((u) => u.role === (payload.role ?? "worker")) ?? mockUsers[0];
      return mockDelay({ user, token: "mock-token-" + user.id });
    }
    const { data } = await api.post("/auth/login", payload);
    return data;
  },

  async register(payload: RegisterPayload): Promise<{ user: User; token: string }> {
    if (USE_MOCKS) {
      const user: User = {
        id: "new-" + Date.now(),
        name: payload.name,
        phone: payload.phone,
        email: payload.email,
        role: payload.role,
        walletBalance: 0,
        isVerified: false,
        createdAt: new Date().toISOString(),
      };
      return mockDelay({ user, token: "mock-token-new" });
    }
    const { data } = await api.post("/auth/register", payload);
    return data;
  },

  async me(): Promise<User> {
    if (USE_MOCKS) {
      const cached = localStorage.getItem("sanda_user");
      return mockDelay(cached ? JSON.parse(cached) : mockUsers[0]);
    }
    const { data } = await api.get("/auth/me");
    return data;
  },

  async getUser(id: string): Promise<User> {
    if (USE_MOCKS) {
      const cached = localStorage.getItem("sanda_user");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.id === id) return mockDelay(parsed);
      }
      const user = mockUsers.find((u) => u.id === id);
      return mockDelay(user ?? mockUsers[0]);
    }
    const { data } = await api.get(`/users/${id}`);
    return data;
  },
};
