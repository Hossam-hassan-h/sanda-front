import api, { USE_MOCKS } from "./client";
import { mockTransactions } from "@/lib/mock/data";
import { mockDelay } from "@/lib/mock/utils";
import type { WalletTransaction } from "./types";

const mapTransaction = (raw: Record<string, unknown>): WalletTransaction => {
  const typeMap: Record<string, WalletTransaction["transactionType"]> = {
    PAYMENT_INITIATED: "hold",
    FUNDS_HELD: "hold",
    CHECK_IN_CONFIRMED: "hold",
    REFUND_PROCESSED: "refund",
    RELEASE_TO_WORKER: "release",
    PLATFORM_FEE_COLLECTED: "withdraw",
    hold: "hold",
    release: "release",
    withdraw: "withdraw",
    deposit: "deposit",
    refund: "refund",
  };
  const job = raw.job as Record<string, unknown> | undefined;

  return {
    id: (raw.id as string) ?? (raw._id as string),
    jobId: typeof raw.job === "string" ? raw.job : ((job?.id as string) ?? (job?._id as string)),
    jobTitle: job?.title as string | undefined,
    amount: raw.amount as number,
    transactionType: typeMap[raw.type as string] ?? "hold",
    paymentStatus: (raw.status as WalletTransaction["paymentStatus"]) ?? "completed",
    createdAt: (raw.createdAt as string) ?? (raw.created_at as string),
  };
};

export const walletApi = {
  async transactions(): Promise<WalletTransaction[]> {
    if (!USE_MOCKS) {
      try {
        const { data } = await api.get("/wallet/transactions");
        const rows = Array.isArray(data) ? data : ((data as Record<string, unknown>).data as Record<string, unknown>[]) ?? [];
        return rows.map((row) => mapTransaction(row as Record<string, unknown>));
      } catch { /* fallback */ }
    }
    return mockDelay(mockTransactions);
  },
  async balance(): Promise<{ available: number; held: number }> {
    if (!USE_MOCKS) {
      try { const { data } = await api.get("/wallet/balance"); return data; } catch { /* fallback */ }
    }
    return mockDelay({ available: 1250, held: 600 });
  },
  async withdraw(amount: number): Promise<{ ok: true }> {
    if (!USE_MOCKS) {
      try { const { data } = await api.post("/wallet/withdraw", { amount }); return data; } catch { /* fallback */ }
    }
    return mockDelay({ ok: true });
  },
};
