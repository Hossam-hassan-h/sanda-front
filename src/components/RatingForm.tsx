import { useState } from "react";
import { z } from "zod";
import { Star } from "lucide-react";

import Feedback from "@/components/Feedback";
import FormSubmitButton from "@/components/FormSubmitButton";
import RatingStars from "@/components/RatingStars";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useCreateRating } from "@/hooks/useRatings";
import { getApiErrorMessage } from "@/lib/api-error";

interface RatingFormProps {
  reviewedUserId: string;
  reviewedUserName: string;
  jobId?: string;
  onSuccess?: () => void;
}

const ratingSchema = z.object({
  rating: z.number().int().min(1, "Choose a star rating.").max(5, "Rating cannot exceed 5 stars."),
  comment: z.string().trim().max(1000, "Comment cannot exceed 1000 characters.").optional(),
});

export default function RatingForm({
  reviewedUserId,
  reviewedUserName,
  jobId,
  onSuccess,
}: RatingFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const createRating = useCreateRating();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (createRating.isPending) return;
    setError("");

    const parsed = ratingSchema.safeParse({ rating, comment });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Review your rating.");
      return;
    }

    try {
      await createRating.mutateAsync({
        rating: parsed.data.rating,
        comment: parsed.data.comment || "",
        reviewedUserId,
        jobId,
      });
      toast({ title: "Rating submitted", description: "Thank you for sharing your experience." });
      setRating(0);
      setComment("");
      onSuccess?.();
    } catch (error) {
      const message = getApiErrorMessage(error, "Could not submit the rating. Please try again.");
      setError(message);
      toast({ title: "Rating failed", description: message, variant: "destructive" });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-bold">
          <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
          Rate {reviewedUserName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="flex flex-col items-center justify-center space-y-2 rounded-xl bg-muted/30 p-4">
            <span className="text-sm font-medium text-muted-foreground">Choose stars</span>
            <RatingStars rating={rating} onChange={setRating} size={36} editable={!createRating.isPending} />
          </div>

          <div className="space-y-1">
            <label htmlFor="rating-comment" className="text-sm font-semibold text-foreground">
              Comment
            </label>
            <Textarea
              id="rating-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Write details about your experience..."
              className="h-24 resize-none"
              maxLength={1000}
              disabled={createRating.isPending}
            />
          </div>

          <Feedback>{error}</Feedback>

          <FormSubmitButton className="w-full" isPending={createRating.isPending} loadingText="Submitting...">
            Submit rating
          </FormSubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
