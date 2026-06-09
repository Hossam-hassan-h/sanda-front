import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, MessageCircle } from "lucide-react";
import UserLayout from "@/layouts/UserLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useConversations, useMessages, useSendMessage } from "@/hooks/useChat";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

export default function Chat() {
  const { data: convos, isLoading } = useConversations();
  const [activeId, setActiveId] = useState<string | null>(null);
  const { data: messages } = useMessages(activeId ?? "");
  const send = useSendMessage();
  const { user } = useAuth();
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (!activeId && convos?.[0]) setActiveId(convos[0].id); }, [convos, activeId]);
  useEffect(() => {
    const el = endRef.current?.parentElement;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || !activeId) return;
    await send.mutateAsync({ conversationId: activeId, message: text });
    setText("");
  };

  const active = convos?.find((c) => c.id === activeId);

  return (
    <UserLayout>
      <div className="container mx-auto px-4 md:px-6 py-6 lg:py-10">
        <h1 className="font-heading font-extrabold text-3xl mb-6">المحادثات</h1>
        <div className="bg-card border border-border rounded-2xl overflow-hidden grid md:grid-cols-[320px_1fr] h-[70vh]">
          {/* Conversations list */}
          <div className="border-e border-border overflow-y-auto">
            {isLoading ? (
              <div className="p-3 space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16" />)}</div>
            ) : convos?.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`w-full text-start p-4 border-b border-border hover:bg-muted/50 transition flex gap-3 ${
                  activeId === c.id ? "bg-primary-soft" : ""
                }`}
              >
                <Avatar className="h-12 w-12 shrink-0">
                  <AvatarImage src={c.participant.avatar} />
                  <AvatarFallback>{c.participant.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold truncate">{c.participant.name}</span>
                    {c.unread > 0 && <span className="bg-accent text-accent-foreground rounded-full text-xs px-1.5 py-0.5">{c.unread}</span>}
                  </div>
                  <div className="text-xs text-primary mb-1 truncate">{c.jobTitle}</div>
                  <div className="text-sm text-muted-foreground truncate">{c.lastMessage}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Messages */}
          {active ? (
            <div className="flex flex-col">
              <div className="p-4 border-b border-border flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={active.participant.avatar} />
                  <AvatarFallback>{active.participant.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{active.participant.name}</div>
                  <div className="text-xs text-primary truncate">{active.jobTitle}</div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/30">
                {messages?.map((m) => {
                  const mine = m.senderId === user?.id || m.senderId === "u1";
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-start" : "justify-end"}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                        mine ? "bg-primary text-primary-foreground rounded-bl-sm" : "bg-card border border-border rounded-br-sm"
                      }`}>
                        <div className="text-sm">{m.message}</div>
                        <div className={`text-[10px] mt-1 ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {new Date(m.createdAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-3 border-t border-border flex gap-2">
                <Button type="button" variant="ghost" size="icon"><Paperclip className="h-5 w-5" /></Button>
                <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="اكتب رسالتك..." />
                <Button type="submit" disabled={!text.trim() || send.isPending}><Send className="h-4 w-4" /></Button>
              </form>
            </div>
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
