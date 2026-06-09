import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  rating: number;
  onChange?: (rating: number) => void;
  size?: number;
  editable?: boolean;
}

export default function RatingStars({
  rating,
  onChange,
  size = 24,
  editable = false,
}: RatingStarsProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const displayRating = hoverRating !== null ? hoverRating : rating;

  return (
    <div className="flex items-center gap-1.5" dir="ltr">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!editable}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => editable && setHoverRating(star)}
          onMouseLeave={() => editable && setHoverRating(null)}
          className={cn(
            "transition-transform focus:outline-none",
            editable && "hover:scale-110 active:scale-95 cursor-pointer"
          )}
        >
          <Star
            style={{ width: size, height: size }}
            className={cn(
              "stroke-1.5 transition-colors duration-150",
              star <= displayRating
                ? "fill-amber-400 text-amber-400 font-bold"
                : "text-muted-foreground/30 fill-transparent"
            )}
          />
        </button>
      ))}
    </div>
  );
}
