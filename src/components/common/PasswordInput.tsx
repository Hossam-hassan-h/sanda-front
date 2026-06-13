import * as React from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PasswordInputProps extends Omit<React.ComponentProps<typeof Input>, "type"> {
  showLeadingIcon?: boolean;
  toggleLabel?: string;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, disabled, showLeadingIcon = false, toggleLabel = "إظهار أو إخفاء كلمة المرور", ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);
    const ToggleIcon = visible ? EyeOff : Eye;

    return (
      <div className="relative">
        {showLeadingIcon && (
          <Lock className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        )}
        <Input
          ref={ref}
          type={visible ? "text" : "password"}
          disabled={disabled}
          className={cn(showLeadingIcon && "ps-9", "pe-11", className)}
          {...props}
        />
        <button
          type="button"
          aria-label={toggleLabel}
          aria-pressed={visible}
          disabled={disabled}
          onClick={() => setVisible((current) => !current)}
          className="absolute end-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
          <ToggleIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

export default PasswordInput;
