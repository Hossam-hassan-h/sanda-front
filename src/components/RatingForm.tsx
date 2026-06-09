import { useState } from "react";
import { useCreateRating } from "@/hooks/useRatings";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import RatingStars from "./RatingStars";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";

interface RatingFormProps {
  reviewedUserId: string;
  reviewedUserName: string;
  jobId?: string;
  onSuccess?: () => void;
}

export default function RatingForm({
  reviewedUserId,
  reviewedUserName,
  jobId,
  onSuccess,
}: RatingFormProps) {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");
  const createRating = useCreateRating();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast({
        title: "تنبيه",
        description: "يرجى تحديد تقييم بالنجوم أولاً",
        variant: "destructive",
      });
      return;
    }

    try {
      await createRating.mutateAsync({
        rating,
        comment,
        reviewedUserId,
        jobId,
      });
      toast({
        title: "شكراً لك!",
        description: "تم إرسال تقييمك بنجاح.",
      });
      setComment("");
      onSuccess?.();
    } catch {
      toast({
        title: "خطأ",
        description: "فشل في إرسال التقييم، يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center justify-center p-4 bg-muted/30 rounded-xl space-y-2">
            <span className="text-sm font-medium text-muted-foreground">
              حدد عدد النجوم
            </span>
            <RatingStars rating={rating} onChange={setRating} size={36} editable />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-foreground">
              تعليقك (اختياري)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="اكتب تفاصيل تجربتك والالتزام بالمواعيد وجودة الخدمة..."
              className="resize-none h-24"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={createRating.isPending}
          >
            {createRating.isPending ? "جاري الإرسال..." : "إرسال التقييم"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
