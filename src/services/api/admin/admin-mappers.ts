import type { User, Job } from "@/api/types";

/**
 * Pure function: تحول الـ raw data من الباك لـ User type
 * - بتشتغل على الـ data بعد camelizeKeys (فـ is_active يبقى isActive)
 * - بتضبط الـ fields اللي مش موجودة في الباك بقيم default
 */
export function mapBackendUser(raw: Record<string, unknown>): User {
  const profileImage = raw.profileImage as Record<string, unknown> | undefined;
  const rawVerificationStatus = raw.verificationStatus as string | undefined;

  return {
    id: (raw.id as string) ?? (raw._id as string),
    name: raw.name as string,
    email: raw.email as string,
    phone: raw.phone as string | undefined,
    role: raw.role as User["role"],
    avatar: profileImage?.url as string | undefined,
    isActive: (raw.isActive as boolean) ?? true,
    isVerified: (raw.isVerified as boolean) ?? false,
    is_verified: (raw.isVerified as boolean) ?? false,
    verification_status: (rawVerificationStatus as User["verification_status"]) ?? "none",
    walletBalance: 0,
    bio: raw.bio as string | undefined,
    city: raw.city as string | undefined,
    skills: raw.skills as string[] | undefined,
    createdAt: raw.createdAt as string,
    updatedAt: raw.updatedAt as string | undefined,
    nationalId: raw.nationalId as User["nationalId"],
    profile_image: profileImage as User["profile_image"],
  };
}

/**
 * Pure function: تحول الـ raw data من الباك لـ Job type
 * - بترجع employer من owner field
 * - بتحول salary ← price, duration ← hours, location ← city
 * - بتحول status من in_progress ← in-progress
 */
export function mapBackendJob(raw: Record<string, unknown>): Job {
  const owner = raw.owner as Record<string, unknown> | undefined;
  const ownerProfileImage = owner?.profileImage as Record<string, unknown> | undefined;

  return {
    id: (raw.id as string) ?? (raw._id as string),
    title: raw.title as string,
    description: raw.description as string,
    category: raw.category as string,
    city: raw.location as string ?? "",
    address: raw.location as string ?? "",
    price: (raw.salary as number) ?? 0,
    hours: (raw.duration as number) ?? 0,
    startDate: raw.startDate as string ?? "",
    endDate: raw.endDate as string | undefined,
    requiredWorkers: raw.requiredWorkers as number | undefined,
    qrCode: raw.qrCode as string | undefined,
    status: ((raw.status as string)?.replace("_", "-") ?? "open") as Job["status"],
    employerId: (owner?.id as string) ?? (owner?._id as string) ?? "",
    employer: {
      id: (owner?.id as string) ?? (owner?._id as string) ?? "",
      name: (owner?.name as string) ?? "",
      avatar: ownerProfileImage?.url as string | undefined,
    },
    applicantsCount: (raw.applicantsCount as number) ?? 0,
    createdAt: raw.createdAt as string,
    updatedAt: raw.updatedAt as string | undefined,
  };
}
