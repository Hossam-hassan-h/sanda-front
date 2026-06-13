import { useState } from "react";
import { useCreateRating } from "@/hooks/useRatings";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import RatingStars from "./RatingStars";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";
import Feedback from "@/components/common/Feedback";
import FormSubmitButton from "@/components/common/FormSubmitButton";
import { getApiErrorMessage } from "@/lib/get-api-error-message";

interface RatingFormProps {
  reviewedUserId: string;
  reviewedUserName: string;
  jobId?: string;
  onSuccess?: () => void;
}

const MAX_COMMENT_LENGTH = 1000;

export default function RatingForm({ reviewedUserId, reviewedUserName, jobId, onSuccess }: RatingFormProps) {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);
  const createRating = useCreateRating();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedComment = comment.trim();
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setFormError("يرجى تحديد تقييم من 1 إلى 5 نجوم.");
      return;
    }
    if (trimmedComment.length > MAX_COMMENT_LENGTH) {
      setFormError("التعليق لا يمكن أن يزيد عن 1000 حرف.");
      return;
    }

    try {
      await createRating.mutateAsync({ rating, comment: trimmedComment, reviewedUserId, jobId });
      toast({ title: "شكرا لك!", description: "تم إرسال تقييمك بنجاح." });
      setRating(0);
      setComment("");
      onSuccess?.();
    } catch (error) {
      const message = getApiErrorMessage(error, "فشل إرسال التقييم، يرجى المحاولة مرة أخرى.");
      setFormError(message);
      toast({ title: "خطأ", description: message, variant: "destructive" });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-bold">
          <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
          تقييم {reviewedUserName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Feedback message={formError} />
          <div className="flex flex-col items-center justify-center p-4 bg-muted/30 rounded-xl space-y-2">
            <span className="text-sm font-medium text-muted-foreground">حدد عدد النجوم</span>
            <RatingStars rating={rating} onChange={setRating} size={36} editable />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-foreground" htmlFor="rating-comment">
              تعليقك (اختياري)
            </label>
            <Textarea
              id="rating-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={MAX_COMMENT_LENGTH}
              placeholder="اكتب تفاصيل تجربتك والالتزام بالمواعيد وجودة الخدمة..."
              className="resize-none h-24"
              disabled={createRating.isPending}
            />
            <div className="text-xs text-muted-foreground text-end">{comment.length}/{MAX_COMMENT_LENGTH}</div>
          </div>

          <FormSubmitButton className="w-full" pending={createRating.isPending} pendingLabel="جاري الإرسال...">
            إرسال التقييم
          </FormSubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
