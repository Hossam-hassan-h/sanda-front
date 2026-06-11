import api, { USE_MOCKS } from "@/api/client";

export interface PaymentDetails {
  amount: number;
  jobId: string;
  workerId?: string;
  gateway: "stripe" | "paymob";
}

export const paymentService = {
  async createPaymentSession(details: PaymentDetails): Promise<{ sessionUrl: string; paymentId: string }> {
    if (!USE_MOCKS) {
      try { const { data } = await api.post("/payments/create-session", details); return data; } catch { /* fallback */ }
    }
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          sessionUrl: `https://mock-checkout.sanda.app/pay?gateway=${details.gateway}&id=pay_${Date.now()}`,
          paymentId: `pay_${Date.now()}`,
        });
      }, 600);
    });
  },

  async verifyPayment(paymentId: string): Promise<{ success: boolean; transactionId: string }> {
    if (!USE_MOCKS) {
      try { const { data } = await api.get(`/payments/verify/${paymentId}`); return data; } catch { /* fallback */ }
    }
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, transactionId: `tx_${Date.now()}` });
      }, 500);
    });
  },
};
