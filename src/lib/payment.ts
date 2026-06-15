import api, { USE_MOCKS } from "@/api/client";

export interface PaymentDetails {
  amount: number;
  jobId: string;
  workerId?: string;
  gateway: "stripe" | "paymob";
}

export interface ApplicationPaymentIntent {
  paymentId: string;
  paymentIntentId: string;
  clientSecret: string;
  publishableKey?: string;
  application: string;
  assignment: string;
  job: string;
  worker: string;
  employer: string;
  jobAmount: number;
  platformFee: number;
  totalAmount: number;
  currency: string;
  status: string;
}

export const paymentService = {
  async createApplicationPaymentIntent(applicationId: string): Promise<ApplicationPaymentIntent> {
    if (!USE_MOCKS) {
      const { data } = await api.post(`/payments/applications/${applicationId}/payment-intent`);
      return data as ApplicationPaymentIntent;
    }
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          paymentId: `pay_${Date.now()}`,
          paymentIntentId: `pi_mock_${Date.now()}`,
          clientSecret: "mock_secret",
          application: applicationId,
          assignment: `asg_${Date.now()}`,
          job: "",
          worker: "",
          employer: "",
          jobAmount: 100,
          platformFee: 5,
          totalAmount: 105,
          currency: "egp",
          status: "PENDING_PAYMENT",
        });
      }, 400);
    });
  },

  async syncPaymentIntent(paymentIntentId: string) {
    if (!USE_MOCKS) {
      const { data } = await api.post(`/payments/payment-intents/${paymentIntentId}/sync`);
      return data;
    }
    return { status: "FUNDS_HELD" };
  },

  async createPaymentSession(details: PaymentDetails): Promise<{ sessionUrl: string; paymentId: string }> {
    if (!USE_MOCKS) {
      throw new Error("Direct payment sessions are not supported by the production backend. Use application payment intents.");
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
      const { data } = await api.get(`/payments/${paymentId}`);
      const payment = data as { status?: string; transactionId?: string; id?: string };
      return {
        success: payment.status === "FUNDS_HELD" || payment.status === "RELEASED" || payment.status === "COMPLETED",
        transactionId: payment.transactionId || payment.id || paymentId,
      };
    }
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, transactionId: `tx_${Date.now()}` });
      }, 500);
    });
  },
};
