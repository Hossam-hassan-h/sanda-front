import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "حدث خطأ",
  message = "حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <AlertCircle className="h-12 w-12 text-destructive mb-4" />
      <h3 className="font-heading font-bold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-4 w-4 ml-2" />
          إعادة المحاولة
        </Button>
      )}
    </div>
  );
}
