import { useState, useCallback } from "react";
import AdminLayout from "@/layouts/AdminLayout";
import { AdminDataTable, type Column } from "@/components/admin/AdminDataTable";
import { Pagination } from "@/components/admin/Pagination";
import { Search } from "@/components/admin/Search";
import { FilterBar } from "@/components/admin/FilterBar";
import { Modal } from "@/components/admin/Modal";
import { ErrorState } from "@/components/admin/ErrorState";
import { TableSkeleton } from "@/components/admin/TableSkeleton";
import { useChatConversationsQuery, useChatConversationQuery } from "@/hooks/useAdminQueries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/api/types";

export default function AdminChatMonitor() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch,
  } = useChatConversationsQuery({
    page,
    pageSize,
    search: search || undefined,
    status: status !== "all" ? status : undefined,
  });

  const conversations = response?.data ?? [];
  const total = response?.total ?? 0;

  const { data: conversationDetail, isLoading: detailLoading } =
    useChatConversationQuery(modalOpen ? selectedId : null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleStatusChange = useCallback((value: string | string[]) => {
    setStatus(value as string);
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setStatus("all");
    setSearch("");
    setPage(1);
  }, []);

  const handleViewConversation = useCallback((item: Conversation) => {
    setSelectedId(item.id);
    setModalOpen(true);
  }, []);

  const columns: Column<Conversation>[] = [
    {
      key: "party",
      header: "الطرف",
      render: (item) => <span className="font-medium">{item.participant.name}</span>,
    },
    {
      key: "jobTitle",
      header: "الوظيفة",
      render: (item) => <span className="text-muted-foreground">{item.jobTitle}</span>,
    },
    {
      key: "lastMessage",
      header: "آخر رسالة",
      render: (item) => (
        <span className="text-muted-foreground text-sm truncate block max-w-[220px]">
          {item.lastMessage}
        </span>
      ),
    },
    {
      key: "lastActivity",
      header: "آخر نشاط",
      render: (item) => (
        <div className="flex items-center gap-1 text-sm text-muted-foreground whitespace-nowrap">
          <Clock className="h-3 w-3" />
          {new Date(item.lastMessageAt).toLocaleString("ar-EG", {
            dateStyle: "short",
            timeStyle: "short",
          })}
        </div>
      ),
    },
    {
      key: "unread",
      header: "غير مقروء",
      className: "text-center",
      render: (item) =>
        item.unread > 0 ? (
          <Badge variant="destructive" className="text-xs">
            {item.unread}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">0</span>
        ),
    },
  ];

  const messages = conversationDetail?.messages ?? [];
  const conversation = conversationDetail?.conversation;
  const uniqueSenders = [...new Set(messages.map((m) => m.senderId))];
  const leftSenderId = uniqueSenders[0] ?? null;

  return (
    <AdminLayout>
      <h1 className="font-heading font-extrabold text-2xl md:text-3xl mb-2">مراقبة المحادثات</h1>
      <p className="text-muted-foreground mb-6">
        مراجعة محتوى المحادثات لضمان الامتثال لقواعد المنصة
      </p>

      <div className="mb-5 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Search
            placeholder="بحث بالوظيفة..."
            onSearch={handleSearch}
            defaultValue={search}
          />
        </div>

        <FilterBar
          filters={[
            {
              key: "status",
              label: "الحالة",
              type: "select",
              options: [
                { value: "active", label: "نشط" },
                { value: "all", label: "الكل" },
              ],
              value: status,
              onChange: handleStatusChange,
            },
          ]}
          onClearAll={clearFilters}
        />
      </div>

      {isError ? (
        <ErrorState
          message={(error as Error)?.message ?? "حدث خطأ أثناء تحميل المحادثات"}
          onRetry={refetch}
        />
      ) : isLoading ? (
        <TableSkeleton rows={5} columns={5} />
      ) : (
        <>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <AdminDataTable
              data={conversations ?? []}
              columns={columns}
              emptyMessage="لا توجد محادثات"
              actions={(item) => (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewConversation(item);
                  }}
                >
                  <Eye className="h-3.5 w-3.5 ml-1" />
                  عرض المحادثة
                </Button>
              )}
              mobileRender={(item: Conversation) => (
                <Card className="border border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{item.participant.name}</span>
                      {item.unread > 0 ? (
                        <Badge variant="destructive" className="text-xs">{item.unread}</Badge>
                      ) : null}
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">{item.jobTitle}</div>
                    <div className="text-sm text-muted-foreground truncate mb-2">{item.lastMessage}</div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(item.lastMessageAt).toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" })}
                      </div>
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleViewConversation(item); }}>
                        <Eye className="h-3.5 w-3.5 ml-1" /> عرض المحادثة
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            />

            {total > 0 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={total}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
              />
            )}
          </div>

          <Modal
            open={modalOpen}
            onOpenChange={(open) => {
              setModalOpen(open);
              if (!open) setSelectedId(null);
            }}
            title="المحادثة"
            size="xl"
          >
            {detailLoading ? (
              <TableSkeleton rows={5} columns={1} />
            ) : conversation ? (
              <div className="flex flex-col max-h-[70vh]">
                <div className="p-4 border-b border-border flex items-center gap-3 bg-muted/20 rounded-t-lg">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{conversation.participant.name}</div>
                    <div className="text-xs text-muted-foreground">{conversation.jobTitle}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {messages.length} رسالة
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <p className="text-center text-muted-foreground text-sm py-8">
                      لا توجد رسائل في هذه المحادثة
                    </p>
                  ) : (
                    messages.map((m) => {
                      const isLeft = m.senderId === leftSenderId;
                      return (
                        <div
                          key={m.id}
                          className={cn(
                            "flex flex-col max-w-[75%]",
                            isLeft ? "items-start" : "items-end mr-auto"
                          )}
                        >
                          <div
                            className={cn(
                              "rounded-2xl px-4 py-2.5 text-sm",
                              isLeft
                                ? "bg-primary text-primary-foreground rounded-br-sm"
                                : "bg-muted rounded-bl-sm"
                            )}
                          >
                            <p>{m.message}</p>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-muted-foreground">
                              {m.senderName}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(m.createdAt).toLocaleString("ar-EG", {
                                dateStyle: "short",
                                timeStyle: "short",
                              })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="p-3 border-t border-border bg-muted/20 text-xs text-muted-foreground text-center rounded-b-lg">
                  وضع المراقبة — لا يمكن إرسال أو تعديل أو حذف الرسائل
                </div>
              </div>
            ) : null}
          </Modal>
        </>
      )}
    </AdminLayout>
  );
}
