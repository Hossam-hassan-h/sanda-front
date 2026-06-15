import { useEffect, useMemo, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { CreditCard, Loader2, ShieldCheck } from "lucide-react";
import Feedback from "@/components/Feedback";
import FormSubmitButton from "@/components/FormSubmitButton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { paymentService, type ApplicationPaymentIntent } from "@/lib/payment";
import { toast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/api-error";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string | null;
  jobTitle: string;
  amount: number;
  onSuccess?: () => void;
}

function PaymentForm({
  payment,
  onSuccess,
}: {
  payment: ApplicationPaymentIntent;
  onSuccess?: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const getStripeErrorMessage = (message?: string) => {
    if (!message) return "Payment failed. Please check your payment details.";
    if (/stripe|secret|client_secret|payment_intent|stack|api key/i.test(message)) {
      return "Payment failed. Please check your payment details.";
    }
    return message;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements || isSubmitting) return;

    setError("");
    setIsSubmitting(true);
    try {
      const result = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (result.error) {
        const message = getStripeErrorMessage(result.error.message);
        setError(message);
        toast({ title: "Payment failed", description: message, variant: "destructive" });
        return;
      }

      const paymentIntentId = result.paymentIntent?.id || payment.paymentIntentId;
      await paymentService.syncPaymentIntent(paymentIntentId);
      toast({
        title: "Payment successful",
        description: "The job amount and platform fee are now held in escrow.",
      });
      onSuccess?.();
    } catch (error) {
      const message = getApiErrorMessage(error, "Payment could not be completed. Please try again.");
      setError(message);
      toast({ title: "Payment failed", description: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <PaymentElement />
      <Feedback>{error}</Feedback>
      <FormSubmitButton
        className="w-full"
        disabled={!stripe}
        isPending={isSubmitting}
        loadingText="Processing payment..."
      >
        {!isSubmitting && <CreditCard className="h-4 w-4" />}
        Pay {payment.totalAmount} {payment.currency.toUpperCase()}
      </FormSubmitButton>
    </form>
  );
}

export default function PaymentModal({
  open,
  onOpenChange,
  applicationId,
  jobTitle,
  amount,
  onSuccess,
}: PaymentModalProps) {
  const [payment, setPayment] = useState<ApplicationPaymentIntent | null>(null);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [setupError, setSetupError] = useState("");

  useEffect(() => {
    if (!open || !applicationId) return;

    let isMounted = true;
    setIsLoading(true);
    setPayment(null);
    setStripePromise(null);
    setSetupError("");

    paymentService
      .createApplicationPaymentIntent(applicationId)
      .then((intent) => {
        if (!isMounted) return;
        const publishableKey = intent.publishableKey || import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
        if (!publishableKey) {
          throw new Error("Stripe publishable key is missing.");
        }
        setPayment(intent);
        setStripePromise(loadStripe(publishableKey));
      })
      .catch((error) => {
        if (!isMounted) return;
        const message = getApiErrorMessage(error, "Payment setup failed. Please try again.");
        setSetupError(message);
        toast({
          title: "Payment setup failed",
          description: message,
          variant: "destructive",
        });
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [applicationId, onOpenChange, open]);

  const options = useMemo(
    () => (payment ? { clientSecret: payment.clientSecret } : undefined),
    [payment],
  );

  const fee = payment?.platformFee ?? Math.round(amount * 0.05 * 100) / 100;
  const total = payment?.totalAmount ?? Math.round((amount + fee) * 100) / 100;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      if (!isLoading) onOpenChange(nextOpen);
    }}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Secure escrow payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/40 p-4 text-sm">
            <div className="font-semibold">{jobTitle}</div>
            <div className="mt-3 flex justify-between">
              <span>Job price</span>
              <strong>{amount}</strong>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Platform fee (5%)</span>
              <span>{fee}</span>
            </div>
            <div className="mt-2 flex justify-between border-t pt-2">
              <span>Total</span>
              <strong className="text-primary">{total}</strong>
            </div>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Preparing payment
            </div>
          )}

          <Feedback>{setupError}</Feedback>

          {stripePromise && options && payment && (
            <Elements stripe={stripePromise} options={options}>
              <PaymentForm
                payment={payment}
                onSuccess={() => {
                  onSuccess?.();
                  onOpenChange(false);
                }}
              />
            </Elements>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
