import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, MessageCircle, Send } from "lucide-react";
import UserLayout from "@/layouts/UserLayout";
import { getApiErrorMessage } from "@/lib/password-reset";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useConversations,
  useMarkConversationRead,
  useMessages,
  useSendMessage,
} from "@/hooks/useChat";
import { useAuth } from "@/context/AuthContext";
import { useSocketConnect } from "@/hooks/useSocket";
import type { Conversation, Message, UserSummary } from "@/api/types";
import { toast } from "@/hooks/use-toast";

const getId = (item: { id?: string; _id?: string } | string | null | undefined) =>
  typeof item === "string" ? item : item?.id ?? item?._id ?? "";

const getAvatar = (user?: UserSummary) =>
  user?.avatar ?? user?.profileImage?.url ?? user?.profile_image?.url ?? undefined;

function getOtherParticipant(conversation: Conversation, userId?: string) {
  return getId(conversation.worker) === userId ? conversation.employer : conversation.worker;
}

function getAssignmentStatus(conversation?: Conversation) {
  return conversation?.assignment?.status;
}

function isSenderMine(message: Message, userId?: string) {
  return getId(message.sender) === userId;
}

export default function Chat() {
  const { user } = useAuth();
  const { isConnected } = useSocketConnect();
  const [searchParams, setSearchParams] = useSearchParams();
  const preselectedId = searchParams.get("conversation");
  const { data: conversations, isLoading, isError } = useConversations();
  const [activeId, setActiveId] = useState<string | null>(null);
  const { data: messages, isLoading: messagesLoading } = useMessages(activeId ?? "");
  const send = useSendMessage();
  const { mutate: markConversationRead } = useMarkConversationRead();
  const [text, setText] = useState("");
  const messagesRef = useRef<HTMLDivElement>(null);

  // Auto-select conversation from URL param, or fall back to first conversation
  useEffect(() => {
    if (!conversations || conversations.length === 0) return;
    if (preselectedId) {
      const match = conversations.find((c) => getId(c) === preselectedId);
      if (match) {
        setActiveId(preselectedId);
        // Clear the search param so it doesn't re-trigger
        setSearchParams({}, { replace: true });
        return;
      }
    }
    if (!activeId && conversations[0]) {
      setActiveId(getId(conversations[0]));
    }
  }, [conversations, preselectedId, activeId, setSearchParams]);

  useEffect(() => {
    if (activeId) markConversationRead(activeId);
  }, [activeId, messages?.length, markConversationRead]);

  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, messages?.length]);

  const active = conversations?.find((conversation) => getId(conversation) === activeId);
  const cancelled = getAssignmentStatus(active) === "cancelled";

  const handleSend = async () => {
    if (!activeId || !text.trim() || cancelled) return;
    const content = text.trim();
    try {
      await send.mutateAsync({ conversationId: activeId, content });
      setText("");
    } catch (err) {
      toast({
        title: "تعذر إرسال الرسالة",
        description: getApiErrorMessage(err, "حاول مرة أخرى"),
        variant: "destructive",
      });
    }
  };

  return (
    <UserLayout>
      <div className="container mx-auto px-4 md:px-6 py-6 lg:py-10" dir="rtl">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="font-heading font-extrabold text-3xl">المحادثات</h1>
          <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${
            isConnected ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-600" : "bg-red-600"}`} />
            {isConnected ? "متصل" : "غير متصل"}
          </span>
        </div>
        <div className="bg-card border border-border rounded-lg overflow-hidden grid md:grid-cols-[320px_1fr] h-[70vh] min-h-[560px]">
          <aside className="border-e border-border overflow-y-auto">
            {isLoading ? (
              <div className="p-3 space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}</div>
            ) : isError ? (
              <div className="p-4 text-sm text-destructive">تعذر تحميل المحادثات</div>
            ) : conversations && conversations.length > 0 ? (
              conversations.map((conversation) => {
                const id = getId(conversation);
                const participant = getOtherParticipant(conversation, user?.id);
                const unread = conversation.unreadCount ?? conversation.unread_count ?? 0;
                return (
                  <button
                    key={id}
                    onClick={() => setActiveId(id)}
                    className={`w-full text-start p-4 border-b border-border hover:bg-muted/50 transition flex gap-3 ${
                      activeId === id ? "bg-primary-soft" : ""
                    }`}
                  >
                    <Avatar className="h-12 w-12 shrink-0">
                      <AvatarImage src={getAvatar(participant)} />
                      <AvatarFallback>{participant?.name?.charAt(0) ?? "؟"}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold truncate">{participant?.name ?? "مستخدم"}</span>
                        {unread > 0 && <span className="bg-accent text-accent-foreground rounded-full text-xs px-1.5 py-0.5">{unread}</span>}
                      </div>
                      <div className="text-xs text-primary mb-1 truncate">{conversation.job?.title}</div>
                      <div className="text-sm text-muted-foreground truncate">{conversation.lastMessage ?? conversation.last_message ?? "لا توجد رسائل بعد"}</div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-6 text-center text-muted-foreground">لا توجد محادثات بعد</div>
            )}
          </aside>

          {active ? (
            <section className="flex flex-col min-w-0 min-h-0">
              <div className="p-4 border-b border-border flex items-center gap-3">
                {(() => {
                  const participant = getOtherParticipant(active, user?.id);
                  return (
                    <>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={getAvatar(participant)} />
                        <AvatarFallback>{participant?.name?.charAt(0) ?? "؟"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{participant?.name ?? "مستخدم"}</div>
                        <div className="text-xs text-primary truncate">{active.job?.title}</div>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div ref={messagesRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/30">
                {messagesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-56 rounded-2xl" />)}
                  </div>
                ) : messages && messages.length > 0 ? (
                  messages.map((message) => {
                    const mine = isSenderMine(message, user?.id);
                    return (
                      <div key={getId(message)} className={`flex ${mine ? "justify-start" : "justify-end"}`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                          mine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card border border-border rounded-bl-sm"
                        }`}>
                          <div className="text-sm whitespace-pre-wrap break-words">{message.content}</div>
                          <div className={`text-[10px] mt-1 ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                            {new Date(message.createdAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-40" />
                      ابدأ المحادثة برسالة قصيرة
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-3 border-t border-border flex gap-2">
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={cancelled ? "هذه المحادثة للقراءة فقط" : "اكتب رسالتك..."}
                  disabled={cancelled}
                  aria-label="الرسالة"
                />
                <Button type="submit" disabled={!text.trim() || send.isPending || cancelled} className="min-h-11" aria-label="إرسال">
                  {send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </section>
          ) : (
            <div className="flex items-center justify-center text-muted-foreground p-8">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-40" />
                اختر محادثة لعرض الرسائل
              </div>
            </div>
          )}
        </div>
      </div>
    </UserLayout>
  );
}
