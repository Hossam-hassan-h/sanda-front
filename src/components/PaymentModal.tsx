import { useEffect, useMemo, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setIsSubmitting(true);
    try {
      const result = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (result.error) {
        toast({
          title: "Payment failed",
          description: getApiErrorMessage(result.error, "Please check your payment details."),
          variant: "destructive",
        });
        return;
      }

      const paymentIntentId = result.paymentIntent?.id || payment.paymentIntentId;
      await paymentService.syncPaymentIntent(paymentIntentId);

      toast({
        title: "Payment secured",
        description: "The job amount and platform fee are now held in escrow.",
      });
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Payment failed",
        description: getApiErrorMessage(error, "Please try again or use another test card."),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button type="submit" className="w-full" disabled={!stripe || isSubmitting}>
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
        Pay {payment.totalAmount} {payment.currency.toUpperCase()}
      </Button>
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
  const [isTestMode, setIsTestMode] = useState(false);

  useEffect(() => {
    if (!open || !applicationId) return;

    let isMounted = true;
    setIsLoading(true);
    setPayment(null);

    paymentService
      .createApplicationPaymentIntent(applicationId)
      .then((intent) => {
        if (!isMounted) return;
        const publishableKey = intent.publishableKey || import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
        if (!publishableKey) {
          throw new Error("Stripe publishable key is missing.");
        }
        setIsTestMode(publishableKey.startsWith("pk_test_"));
        setPayment(intent);
        setStripePromise(loadStripe(publishableKey));
      })
      .catch((error) => {
        toast({
          title: "Payment setup failed",
          description: getApiErrorMessage(error, "Please try again."),
          variant: "destructive",
        });
        onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
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

          {isTestMode && (
            <div className="rounded-lg border border-dashed border-warning/40 bg-warning/5 p-3 text-xs text-muted-foreground">
              <div className="font-semibold text-warning mb-1">Test mode &mdash; use a Stripe test card</div>
              <div>Card Number: 4242 4242 4242 4242</div>
              <div>Expiry: Any future date</div>
              <div>CVC: Any 3 digits</div>
              <div>ZIP: Any valid ZIP</div>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Preparing payment
            </div>
          )}

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
