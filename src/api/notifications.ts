import api, { USE_MOCKS } from "./client";
import { mockDelay } from "@/lib/mock/utils";
import type { Notification, ApiSuccessResponse } from "./types";

const mockNotifications: Notification[] = [
  // ── Admin notifications ──
  {
    id: "a1",
    title: "بلاغ جديد من مستخدم",
    message: "أحمد المصري أبلغ عن مخالفة في وظيفة تركيب أثاث.",
    type: "report",
    roleTarget: "admin",
    isRead: false,
    createdAt: "2026-06-08T09:00:00",
    metadata: { reportId: "rp1", userId: "u1" },
  },
  {
    id: "a2",
    title: "مستخدم جديد مسجل",
    message: "انضم محمد علي إلى المنصة كمستخدم جديد.",
    type: "user",
    roleTarget: "admin",
    isRead: false,
    createdAt: "2026-06-08T08:30:00",
    metadata: { userId: "u10" },
  },
  {
    id: "a3",
    title: "وظيفة جديدة منشورة",
    message: "تم نشر وظيفة 'مصمم جرافيك' بواسطة شركة تصميم.",
    type: "job",
    roleTarget: "admin",
    isRead: true,
    createdAt: "2026-06-07T14:00:00",
    metadata: { jobId: "j15" },
  },
  {
    id: "a4",
    title: "بلاغ تم حله",
    message: "تم حل البلاغ رقم r2 بعد المراجعة.",
    type: "report",
    roleTarget: "admin",
    isRead: false,
    createdAt: "2026-06-08T10:15:00",
    metadata: { reportId: "rp2" },
  },
  {
    id: "a5",
    title: "مستخدمون جدد اليوم",
    message: "تم تسجيل 5 مستخدمين جدد خلال الـ 24 ساعة الماضية.",
    type: "user",
    roleTarget: "admin",
    isRead: true,
    createdAt: "2026-06-07T23:59:00",
  },
  // ── Worker notifications ──
  {
    id: "w1",
    title: "وظيفة جديدة تناسبك",
    message: "مطلوب نادل في مطعم البيت السوري — ٦٠٠ جنيه.",
    type: "job",
    roleTarget: "worker",
    isRead: false,
    createdAt: "2026-06-08T11:00:00",
    metadata: { jobId: "j1" },
  },
  {
    id: "w2",
    title: "تم قبولك في وظيفة",
    message: "تم قبولك للعمل كمساعد مطبخ في مطعم البيت السوري.",
    type: "job",
    roleTarget: "worker",
    isRead: false,
    createdAt: "2026-06-07T10:00:00",
    metadata: { jobId: "j4" },
  },
  {
    id: "w3",
    title: "تم تحرير مبلغ من المحفظة",
    message: "تم تحويل ٢٥٠ جنيه إلى رصيدك المتاح.",
    type: "system",
    roleTarget: "worker",
    isRead: true,
    createdAt: "2026-06-06T18:00:00",
    metadata: { transactionId: "t1", amount: 250 },
  },
  // ── User (employer) notifications ──
  {
    id: "u1",
    title: "متقدم جديد على وظيفتك",
    message: "أحمد المصري تقدم على وظيفة تركيب أثاث ايكيا.",
    type: "user",
    roleTarget: "user",
    isRead: false,
    createdAt: "2026-06-08T09:45:00",
    metadata: { jobId: "j2", applicantId: "u1" },
  },
  {
    id: "u2",
    title: "تم إكمال وظيفة",
    message: "تم تأكيد إكمال وظيفة 'تركيب أثاث' من قبل العامل.",
    type: "system",
    roleTarget: "user",
    isRead: true,
    createdAt: "2026-06-07T16:00:00",
    metadata: { jobId: "j2" },
  },
  {
    id: "u3",
    title: "رسالة جديدة",
    message: "مطعم البيت السوري: أهلًا، يومك ابتدا بكرة من ٥م.",
    type: "system",
    roleTarget: "user",
    isRead: false,
    createdAt: "2026-06-08T07:30:00",
    metadata: { conversationId: "c1" },
  },
  // ── All roles (global) notifications ──
  {
    id: "g1",
    title: "تحديث في سياسة المنصة",
    message: "تم تحديث سياسة الاستخدام — يرجى الاطلاع.",
    type: "system",
    roleTarget: "all",
    isRead: false,
    createdAt: "2026-06-08T06:00:00",
  },
  {
    id: "g2",
    title: "صيانة مجدولة",
    message: "المنصة ستخضع للصيانة يوم الجمعة من ٢ص إلى ٦ص.",
    type: "system",
    roleTarget: "all",
    isRead: true,
    createdAt: "2026-06-05T12:00:00",
  },
];

export const notificationsApi = {
  async list(role?: string): Promise<Notification[]> {
    if (USE_MOCKS) {
      let filtered = [...mockNotifications];
      if (role) {
        filtered = filtered.filter(
          (n) => n.roleTarget === "all" || n.roleTarget === role
        );
      }
      filtered.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      return mockDelay(filtered);
    }
    const { data } = await api.get<Notification[]>("/notifications", {
      params: { role },
    });
    return data;
  },

  async unreadCount(role?: string): Promise<{ count: number }> {
    if (USE_MOCKS) {
      const filtered =
        role
          ? mockNotifications.filter(
              (n) => !n.isRead && (n.roleTarget === "all" || n.roleTarget === role)
            )
          : mockNotifications.filter((n) => !n.isRead);
      return mockDelay({ count: filtered.length });
    }
    const { data } = await api.get<{ count: number }>("/notifications/unread-count");
    return data;
  },

  async markRead(id: string): Promise<ApiSuccessResponse> {
    if (USE_MOCKS) {
      const notif = mockNotifications.find((n) => n.id === id);
      if (notif) notif.isRead = true;
      return mockDelay({ ok: true });
    }
    const { data } = await api.patch<ApiSuccessResponse>(`/notifications/${id}/read`);
    return data;
  },

  async markAllRead(): Promise<ApiSuccessResponse> {
    if (USE_MOCKS) {
      mockNotifications.forEach((n) => (n.isRead = true));
      return mockDelay({ ok: true });
    }
    const { data } = await api.patch<ApiSuccessResponse>("/notifications/read-all");
    return data;
  },

  async delete(id: string): Promise<ApiSuccessResponse> {
    if (USE_MOCKS) {
      const idx = mockNotifications.findIndex((n) => n.id === id);
      if (idx > -1) mockNotifications.splice(idx, 1);
      return mockDelay({ ok: true });
    }
    const { data } = await api.delete<ApiSuccessResponse>(`/notifications/${id}`);
    return data;
  },
};
