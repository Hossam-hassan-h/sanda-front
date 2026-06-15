import type { User, Job, Report, UserSummary, JobSummary } from "@/api/types";

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
    name: (raw.name as string) ?? "",
    email: (raw.email as string) ?? "",
    phone: raw.phone as string | undefined,
    role: (raw.role as User["role"]) ?? "worker",
    avatar: profileImage?.url as string | undefined,
    isActive: (raw.isActive as boolean) ?? true,
    isBlocked: (raw.isBlocked as boolean) ?? false,
    isVerified: (raw.isVerified as boolean) ?? false,
    is_verified: (raw.isVerified as boolean) ?? false,
    verification_status: (rawVerificationStatus as User["verification_status"]) ?? "none",
    walletBalance: 0,
    workerState: raw.workerState as User["workerState"],
    worker_state: raw.workerState as User["worker_state"],
    attendanceRate: raw.attendanceRate as number | undefined,
    attendance_rate: raw.attendanceRate as number | undefined,
    noShowCount: raw.noShowCount as number | undefined,
    no_show_count: raw.noShowCount as number | undefined,
    completedJobsCount: raw.completedJobsCount as number | undefined,
    completed_jobs_count: raw.completedJobsCount as number | undefined,
    cancellationCount: raw.cancellationCount as number | undefined,
    cancellation_count: raw.cancellationCount as number | undefined,
    reportCount: raw.reportCount as number | undefined,
    report_count: raw.reportCount as number | undefined,
    suspensionUntil: raw.suspensionUntil as string | null | undefined,
    suspension_until: raw.suspensionUntil as string | null | undefined,
    adminReviewRequired: raw.adminReviewRequired as boolean | undefined,
    admin_review_required: raw.adminReviewRequired as boolean | undefined,
    bio: raw.bio as string | undefined,
    city: raw.city as string | undefined,
    skills: raw.skills as string[] | undefined,
    createdAt: (raw.createdAt as string) ?? "",
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

function mapUserSummary(raw: unknown): UserSummary {
  if (!raw || typeof raw !== "object") return { id: "", name: "" };
  const user = raw as Record<string, unknown>;
  const profileImage = user.profileImage as Record<string, unknown> | undefined;

  return {
    id: ((user.id as string) ?? (user._id as string) ?? ""),
    name: (user.name as string) ?? "",
    avatar: (profileImage?.url as string | undefined) ?? (user.avatar as string | undefined),
    profileImage: profileImage as UserSummary["profileImage"],
    role: user.role as string | undefined,
  } as UserSummary;
}

function mapJobSummary(raw: unknown): JobSummary | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const job = raw as Record<string, unknown>;

  return {
    id: ((job.id as string) ?? (job._id as string) ?? ""),
    title: (job.title as string) ?? "",
    city: ((job.location as string) ?? (job.city as string) ?? ""),
    price: (job.salary as number) ?? (job.price as number) ?? 0,
    category: job.category as string | undefined,
    location: job.location as string | undefined,
    status: job.status as string | undefined,
    startDate: job.startDate as string | undefined,
    endDate: job.endDate as string | undefined,
    salary: job.salary as number | undefined,
  };
}

export function mapBackendReport(raw: Record<string, unknown>): Report {
  const reportedUser = mapUserSummary(raw.reportedUser);
  const reportedBy = mapUserSummary(raw.reportedBy);

  return {
    id: ((raw.id as string) ?? (raw._id as string) ?? ""),
    reportedUserId: reportedUser.id,
    reportedUser,
    reportedById: reportedBy.id,
    reportedBy,
    reason: (raw.reason as string) ?? "",
    status: (raw.status as Report["status"]) ?? "open",
    createdAt: (raw.createdAt as string) ?? "",
    jobId: typeof raw.job === "string" ? raw.job : mapJobSummary(raw.job)?.id,
    job: mapJobSummary(raw.job),
  };
}
