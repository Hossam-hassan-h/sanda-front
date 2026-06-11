import api, { USE_MOCKS } from "./client";
import { mockTransactions } from "@/lib/mock/data";
import { mockDelay } from "@/lib/mock/utils";
import type { WalletTransaction } from "./types";

export const walletApi = {
  async transactions(): Promise<WalletTransaction[]> {
    if (!USE_MOCKS) {
      try { const { data } = await api.get("/wallet/transactions"); return data; } catch { /* fallback */ }
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
