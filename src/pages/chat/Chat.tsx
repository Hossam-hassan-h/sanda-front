import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, MessageCircle, Loader2, X, FileText, Image as ImageIcon } from "lucide-react";
import UserLayout from "@/layouts/UserLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useConversations, useMessages, useSendMessage } from "@/hooks/useChat";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import type { MessageAttachment } from "@/api/types";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

function isImageFile(file: File | MessageAttachment) {
  const name = "name" in file ? file.name : file.name;
  return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(name) || file.type?.startsWith("image/");
}

export default function Chat() {
  const { data: convos, isLoading } = useConversations();
  const [activeId, setActiveId] = useState<string | null>(null);
  const { data: messages } = useMessages(activeId ?? "");
  const send = useSendMessage();
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (!activeId && convos?.[0]) setActiveId(convos[0].id); }, [convos, activeId]);
  useEffect(() => {
    const el = endRef.current?.parentElement;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);
    const oversized = selected.find((f) => f.size > MAX_FILE_SIZE);
    if (oversized) {
      alert(`الملف "${oversized.name}" حجمه أكبر من 10 MB`);
      return;
    }
    setFiles((prev) => [...prev, ...selected]);
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if ((!text.trim() && files.length === 0) || !activeId) return;
    try {
      await send.mutateAsync({ conversationId: activeId, message: text, attachments: files.length ? files : undefined });
      setText("");
      setFiles([]);
    } catch {
      alert("فشل إرسال الرسالة");
    }
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
                {messages === undefined && activeId ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                        <Skeleton className={`h-12 ${i % 2 === 0 ? "w-48" : "w-56"} rounded-2xl`} />
                      </div>
                    ))}
                  </div>
                ) : (
                  messages?.map((m) => {
                    const mine = m.senderId === user?.id;
                    return (
                      <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                          mine ? "bg-primary text-primary-foreground rounded-bl-sm" : "bg-card border border-border rounded-br-sm"
                        }`}>
                          {m.message && <div className="text-sm">{m.message}</div>}
                          {m.attachments && m.attachments.length > 0 && (
                            <div className={`mt-2 space-y-1.5 ${mine ? "" : ""}`}>
                              {m.attachments.map((att, i) => (
                                <AttachmentPreview key={i} attachment={att} mine={mine} />
                              ))}
                            </div>
                          )}
                          <div className={`text-[10px] mt-1 ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                            {new Date(m.createdAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={endRef} />
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-3 border-t border-border flex flex-col gap-2">
                {files.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center gap-1.5 bg-muted rounded-lg px-2.5 py-1.5 text-xs max-w-[200px]">
                        {isImageFile(f) ? <ImageIcon className="w-3.5 h-3.5 shrink-0" /> : <FileText className="w-3.5 h-3.5 shrink-0" />}
                        <span className="truncate">{f.name}</span>
                        <span className="text-muted-foreground shrink-0">{formatFileSize(f.size)}</span>
                        <button type="button" onClick={() => removeFile(i)} className="p-0.5 hover:bg-destructive/10 rounded-full" aria-label="إزالة الملف">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                    aria-label="اختيار ملفات"
                  />
                  <Button type="button" variant="ghost" size="icon" className="min-h-11 min-w-11" onClick={() => fileInputRef.current?.click()} aria-label="إرفاق ملف">
                    <Paperclip className="h-5 w-5" />
                  </Button>
                  <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="اكتب رسالتك..." aria-label="الرسالة" />
                  <Button type="submit" disabled={(!text.trim() && files.length === 0) || send.isPending} className="min-h-11" aria-label="إرسال">
                    {send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
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

function AttachmentPreview({ attachment, mine }: { attachment: MessageAttachment; mine: boolean }) {
  const isImage = isImageFile(attachment);

  if (isImage) {
    return (
      <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="block rounded-lg overflow-hidden border border-white/20">
        <img src={attachment.url} alt={attachment.name} className="max-h-40 w-full object-cover" />
      </a>
    );
  }

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
        mine ? "bg-primary-foreground/10 hover:bg-primary-foreground/20" : "bg-muted hover:bg-muted/80"
      } transition-colors`}
    >
      <FileText className="w-4 h-4 shrink-0" />
      <span className="truncate">{attachment.name}</span>
      <span className="shrink-0 opacity-70">{formatFileSize(attachment.size)}</span>
    </a>
  );
}
