import * as React from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

interface FormSubmitButtonProps extends React.ComponentProps<typeof Button> {
  isPending?: boolean;
  loadingText?: React.ReactNode;
}

export default function FormSubmitButton({
  children,
  disabled,
  isPending = false,
  loadingText,
  type = "submit",
  ...props
}: FormSubmitButtonProps) {
  return (
    <Button type={type} disabled={disabled || isPending} aria-busy={isPending} {...props}>
      {isPending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
      {isPending ? loadingText || children : children}
    </Button>
  );
}
