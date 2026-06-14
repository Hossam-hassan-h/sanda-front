import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chatApi } from "@/api/chat";
import type { Conversation, Message } from "@/api/types";

const getId = (item: { id?: string; _id?: string } | string | undefined) =>
  typeof item === "string" ? item : item?.id ?? item?._id ?? "";

const sortConversations = (items: Conversation[]) =>
  [...items].sort((a, b) => {
    const aTime = a.lastMessageAt ?? a.last_message_at ?? a.updatedAt ?? "";
    const bTime = b.lastMessageAt ?? b.last_message_at ?? b.updatedAt ?? "";
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });

export const useCreateConversation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assignmentId: string) => chatApi.createConversation(assignmentId),
    onSuccess: (conversation) => {
      qc.setQueryData<Conversation[]>(["conversations"], (old = []) =>
        sortConversations([
          conversation,
          ...old.filter((item) => getId(item) !== getId(conversation)),
        ]),
      );
    },
  });
};

export const useConversations = () =>
  useQuery({ queryKey: ["conversations"], queryFn: () => chatApi.conversations() });

export const useConversation = (conversationId: string) =>
  useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: () => chatApi.conversation(conversationId),
    enabled: !!conversationId,
  });

export const useMessages = (conversationId: string) =>
  useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => chatApi.messages(conversationId),
    enabled: !!conversationId,
  });

export const useSendMessage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, content }: { conversationId: string; content: string }) =>
      chatApi.send(conversationId, content),
    onSuccess: (message, vars) => {
      qc.setQueryData<Message[]>(["messages", vars.conversationId], (old = []) =>
        old.some((item) => getId(item) === getId(message)) ? old : [...old, message],
      );
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};

export const useMarkConversationRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) => chatApi.markRead(conversationId),
    onSuccess: (_result, conversationId) => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.setQueryData<Message[]>(["messages", conversationId], (old = []) =>
        old.map((message) => ({ ...message, readAt: message.readAt ?? new Date().toISOString() })),
      );
    },
  });
};
