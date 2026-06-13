import api, { USE_MOCKS } from "@/api/client";
import type { AdminStats } from "@/api/types";
import { mockUsers, mockJobs } from "@/lib/mock/data";

function countByProperty<T extends Record<string, unknown>>(
  items: T[],
  key: keyof T
): { name: string; count: number }[] {
  const map = new Map<string, number>();
  for (const item of items) {
    const val = String(item[key] ?? "أخرى");
    map.set(val, (map.get(val) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

function computeStats(rawUsers: Record<string, unknown>[], rawJobs: Record<string, unknown>[]): AdminStats {
  const activeJobs = rawJobs.filter((j) => {
    const status = j.status as string;
    return status === "open" || status === "in_progress";
  }).length;

  const today = new Date().toISOString().slice(0, 10);
  const jobsToday = rawJobs.filter((j) => {
    const created = j.createdAt as string;
    return created?.startsWith(today);
  }).length;

  const newUsersToday = rawUsers.filter((u) => {
    const created = u.createdAt as string;
    return created?.startsWith(today);
  }).length;

  const heldAmount = rawJobs.reduce((sum, j) => {
    const salary = Number(j.salary) || 0;
    return sum + salary;
  }, 0);

  const openReports = rawUsers.filter((u) => {
    const isActive = u.is_active as boolean;
    return isActive === false;
  }).length;

  const jobsByCategory = countByProperty(rawJobs, "category" as keyof typeof rawJobs[0]);
  const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
                  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

  const now = new Date();
  const revenueByMonth = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const amount = rawJobs
      .filter((j) => (j.createdAt as string)?.startsWith(monthStr))
      .reduce((sum, j) => sum + (Number(j.salary) || 0), 0);
    return { month: months[d.getMonth()], amount };
  });

  return {
    totalUsers: rawUsers.length,
    totalJobs: rawJobs.length,
    activeJobs,
    heldAmount,
    openReports,
    jobsToday,
    newUsersToday,
    applicationsToday: 0,
    revenueByMonth,
    jobsByCategory,
  };
}

export async function fetchDashboardStats(): Promise<AdminStats | null> {
  if (USE_MOCKS) {
    const rawUsers = mockUsers as unknown as Record<string, unknown>[];
    const rawJobs = mockJobs as unknown as Record<string, unknown>[];
    return computeStats(rawUsers, rawJobs);
  }
  try {
    const [usersRes, jobsRes] = await Promise.all([
      api.get("/admin/users"),
      api.get("/admin/jobs"),
    ]);

    const usersBody = usersRes.data as { data: Record<string, unknown>[] };
    const jobsBody = jobsRes.data as { data: Record<string, unknown>[] };

    const rawUsers = usersBody.data ?? [];
    const rawJobs = jobsBody.data ?? [];

    if (!Array.isArray(rawUsers) || !Array.isArray(rawJobs)) return null;

    return computeStats(rawUsers, rawJobs);
  } catch {
    return null;
  }
}
