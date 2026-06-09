import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chatApi } from "@/api/chat";

export const useConversations = () =>
  useQuery({ queryKey: ["conversations"], queryFn: () => chatApi.conversations() });

export const useMessages = (conversationId: string) =>
  useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => chatApi.messages(conversationId),
    enabled: !!conversationId,
  });

export const useSendMessage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, message, attachments }: { conversationId: string; message: string; attachments?: File[] }) =>
      chatApi.send(conversationId, message, attachments),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["messages", vars.conversationId] }),
  });
};
