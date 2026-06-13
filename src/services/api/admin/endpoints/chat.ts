import api, { USE_MOCKS } from "@/api/client";
import type { Conversation } from "@/api/types";
import type { PaginatedResponse, AdminChatParams, ChatDetail } from "../admin-types";
import { richMockConversations } from "../admin-mocks";

function filterMockChats(params?: AdminChatParams): Conversation[] {
  let items = [...richMockConversations] as unknown as Conversation[];
  if (params?.search) {
    const q = params.search.toLowerCase();
    items = items.filter((c) => {
      const raw = c as Record<string, unknown>;
      const title = (raw.jobTitle as string) ?? (c.job?.title ?? "");
      const part = raw.participant as Record<string, unknown> | undefined;
      const partName = part?.name as string ?? "";
      const lastMsg = c.last_message ?? "";
      return title.toLowerCase().includes(q) || partName.toLowerCase().includes(q) || lastMsg.toLowerCase().includes(q);
    });
  }
  return items;
}

export async function fetchChats(params?: AdminChatParams): Promise<PaginatedResponse<Conversation> | null> {
  if (USE_MOCKS) {
    const filtered = filterMockChats(params);
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 10;
    return {
      data: filtered.slice((page - 1) * pageSize, page * pageSize),
      total: filtered.length,
      page,
      pageSize,
    };
  }
  try {
    const backendParams: Record<string, unknown> = {
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 10,
    };
    if (params?.search) backendParams.search = params.search;
    if (params?.status) backendParams.status = params.status;

    const response = await api.get("/admin/chats", { params: backendParams });
    const body = response.data as { data: Conversation[]; pagination?: { page: number; pageSize: number; total: number; totalPages: number } };
    let items = body.data ?? [];

    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter((c) =>
        c.job?.title?.toLowerCase().includes(q) ||
        c.employer?.name?.toLowerCase().includes(q) ||
        c.worker?.name?.toLowerCase().includes(q) ||
        (c.last_message ?? "").toLowerCase().includes(q)
      );
    }

    const pagination = body.pagination;

    return {
      data: items,
      total: pagination?.total ?? items.length,
      page: pagination?.page ?? (params?.page ?? 1),
      pageSize: pagination?.pageSize ?? (params?.pageSize ?? 10),
    };
  } catch {
    return null;
  }
}

export async function fetchChatById(id: string): Promise<ChatDetail | null> {
  if (USE_MOCKS) {
    const { mockChatHandlers } = await import("../admin-mocks");
    return mockChatHandlers.getById(id);
  }
  try {
    const response = await api.get(`/admin/chats/${id}`);
    const raw = response.data as { conversation: Conversation; messages: Record<string, unknown>[] };
    const messages = (raw.messages ?? []).map((m) => {
      const sender = m.sender as Record<string, unknown> | undefined;
      return {
        id: (m.id as string) ?? (m._id as string) ?? "",
        senderId: (sender?.id as string) ?? (sender?._id as string) ?? (m.sender as string) ?? "",
        senderName: (sender?.name as string) ?? "مستخدم",
        message: (m.content as string) ?? (m.message as string) ?? "",
        createdAt: m.createdAt as string,
      };
    });
    return { conversation: raw.conversation, messages };
  } catch {
    return null;
  }
}
