import api, { USE_MOCKS } from "./client";
import { mockUsers } from "@/lib/mock/data";
import { mockDelay } from "@/lib/mock/utils";
import type { User, UserRole } from "./types";

export interface LoginPayload { email: string; password: string; role?: UserRole }
export interface RegisterPayload { name: string; email: string; phone?: string; password: string; role: UserRole }
export interface RegisterResponse { message: string; userId: string; email: string }
export interface VerifyEmailPayload { email: string; otp: string }
export interface ForgotPasswordPayload { email: string }
export interface ResetPasswordPayload { email: string; otp: string; newPassword: string }

const mapUser = (raw: Record<string, unknown>): User => {
  const user = { ...raw } as Record<string, unknown>;
  if (user.profileImage && typeof user.profileImage === "object") {
    user.avatar = (user.profileImage as Record<string, unknown>).url as string || null;
  } else if (!user.avatar) {
    user.avatar = null;
  }
  return {
    id: (user.id as string) || (user.Id as string) || (user._id as string),
    name: user.name as string,
    email: user.email as string,
    phone: user.phone as string || undefined,
    role: user.role as UserRole,
    avatar: user.avatar as string | undefined,
    walletBalance: (user.walletBalance as number) ?? 0,
    isVerified: (user.isVerified as boolean) ?? false,
    confirmedMail: user.confirmedMail as boolean | undefined,
    isActive: (user.isActive as boolean) ?? true,
    rating: user.rating as number | undefined,
    ratingsCount: user.ratingsCount as number | undefined,
    bio: user.bio as string | undefined,
    city: user.city as string | undefined,
    skills: user.skills as string[] | undefined,
    createdAt: user.createdAt as string,
    updatedAt: user.updatedAt as string | undefined,
  } as User;
};

export const authApi = {
  async login(payload: LoginPayload): Promise<{ user: User; token: string }> {
    if (USE_MOCKS) {
      const user = mockUsers.find((u) => u.email === payload.email);
      if (!user) throw new Error("Invalid credentials");
      return mockDelay({ user, token: "mock-token-" + user.id });
    }
    const { data } = await api.post("/auth/login", payload);
    localStorage.setItem("sanda_token", data.accessToken as string);
    const user = await authApi.me();
    return { user, token: data.accessToken as string };
  },

  async register(payload: RegisterPayload): Promise<RegisterResponse> {
    if (USE_MOCKS) {
      return mockDelay({
        message: "OTP sent to email",
        userId: "new-" + Date.now(),
        email: payload.email,
      });
    }
    const { data } = await api.post("/users/register", payload);
    const raw = data as Record<string, unknown>;
    return {
      message: String(raw.message || "OTP sent to email"),
      userId: String(raw.userId || raw.id || ""),
      email: payload.email,
    };
  },

  async verifyEmail(payload: VerifyEmailPayload): Promise<{ user: User; token: string }> {
    if (USE_MOCKS) {
      const user = mockUsers.find((u) => u.email === payload.email) ?? mockUsers[0];
      return mockDelay({ user, token: "mock-token-" + user.id });
    }
    const { data } = await api.post("/auth/verify-email", payload);
    const raw = data as Record<string, unknown>;
    const token = raw.accessToken as string;
    localStorage.setItem("sanda_token", token);
    return { user: mapUser(raw.user as Record<string, unknown>), token };
  },

  async me(): Promise<User> {
    if (USE_MOCKS) {
      const cached = localStorage.getItem("sanda_user");
      return mockDelay(cached ? JSON.parse(cached) : mockUsers[0]);
    }
    const { data } = await api.get("/users/profile");
    return mapUser(data as Record<string, unknown>);
  },

  async updateProfile(id: string, data: Partial<User>): Promise<User> {
    const payload = { ...data } as Record<string, unknown>;
    if (payload.avatar) {
      payload.profile_image = { url: payload.avatar };
      delete payload.avatar;
    }
    const { data: res } = await api.put(`/users/profile/${id}`, payload);
    return mapUser(res as Record<string, unknown>);
  },

  async uploadProfileImage(userId: string, file: File): Promise<string> {
    if (USE_MOCKS) return mockDelay(URL.createObjectURL(file));
    const form = new FormData();
    form.append("profileImage", file);
    const { data } = await api.patch(`/users/documents/${userId}`, form);
    const u = ((data as Record<string, unknown>).data ?? data) as Record<string, unknown>;
    const pi = u.profileImage as { url?: string } | undefined;
    return pi?.url ?? "";
  },

  async uploadVerificationDocuments(
    userId: string,
    files: { nationalIdFront: File; nationalIdBack: File }
  ): Promise<User> {
    if (USE_MOCKS) {
      const cached = localStorage.getItem("sanda_user");
      return mockDelay(cached ? JSON.parse(cached) : mockUsers[0]);
    }
    const form = new FormData();
    form.append("nationalIdFront", files.nationalIdFront);
    form.append("nationalIdBack", files.nationalIdBack);
    const { data } = await api.patch(`/users/documents/${userId}`, form);
    const raw = ((data as Record<string, unknown>).data ?? data) as Record<string, unknown>;
    return mapUser(raw);
  },

  async getUser(id: string): Promise<User> {
    if (!USE_MOCKS) {
      try {
        const { data } = await api.get(`/users/profile/${id}`);
        return mapUser(data as Record<string, unknown>);
      } catch {
        // fallback to mock data
      }
    }
    const cached = localStorage.getItem("sanda_user");
    if (cached) {
      const parsed = JSON.parse(cached) as User;
      if (parsed.id === id) return mockDelay(parsed);
    }
    const user = mockUsers.find((u) => u.id === id);
    return mockDelay(user ?? mockUsers[0]);
  },

  async updatePassword(id: string, payload: { currentPassword: string; newPassword: string }): Promise<void> {
    if (USE_MOCKS) {
      return mockDelay(undefined);
    }
    await api.put("/auth/change-password", payload);
  },

  async forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
    if (USE_MOCKS) return mockDelay(undefined);
    await api.post("/auth/forgot-password", payload);
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<void> {
    if (USE_MOCKS) return mockDelay(undefined);
    await api.post("/auth/reset-password", payload);
  },
};
