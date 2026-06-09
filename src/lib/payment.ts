import { USE_MOCKS } from "@/api/client";

export interface PaymentDetails {
  amount: number;
  jobId: string;
  workerId?: string;
  gateway: "stripe" | "paymob";
}

export const paymentService = {
  /** Create a payment session/intent */
  async createPaymentSession(details: PaymentDetails): Promise<{ sessionUrl: string; paymentId: string }> {
    if (USE_MOCKS) {
      console.log(`[PaymentService] Creating payment session via ${details.gateway} for Job: ${details.jobId}, Amount: ${details.amount}`);
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            sessionUrl: `https://mock-checkout.sanda.app/pay?gateway=${details.gateway}&id=pay_${Date.now()}`,
            paymentId: `pay_${Date.now()}`,
          });
        }, 600);
      });
    }

    // In production, invoke real endpoint:
    // const { data } = await api.post("/payments/create-session", details);
    // return data;
    throw new Error("Backend not configured");
  },

  /** Verify payment status after callback */
  async verifyPayment(paymentId: string): Promise<{ success: boolean; transactionId: string }> {
    if (USE_MOCKS) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            transactionId: `tx_${Date.now()}`,
          });
        }, 500);
      });
    }

    // const { data } = await api.get(`/payments/verify/${paymentId}`);
    // return data;
    throw new Error("Backend not configured");
  },
};
