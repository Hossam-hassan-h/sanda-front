import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";

interface FormSubmitButtonProps extends Omit<ButtonProps, "type"> {
  isPending?: boolean;
  loadingText?: ReactNode;
}

export default function FormSubmitButton({
  children,
  disabled,
  isPending = false,
  loadingText,
  ...props
}: FormSubmitButtonProps) {
  return (
    <Button type="submit" disabled={disabled || isPending} aria-busy={isPending || undefined} {...props}>
      {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {isPending && loadingText ? loadingText : children}
    </Button>
  );
}
