import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /* button-primary — black marketing-surface CTA */
        default: "bg-primary text-primary-foreground hover:bg-primary-deep",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        /* button-secondary — outlined ghost paired with primary in dual-CTA hero patterns */
        outline: "border-2 border-ink-deep bg-background hover:bg-muted text-ink-deep",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        /* button-ghost — quieter outlined tertiary action */
        ghost: "rounded-md border-0 hover:bg-accent/10 hover:text-accent",
        link: "text-meta-link underline-offset-4 hover:underline rounded-none",
        /* button-buy-cta — cobalt CTA reserved for the app's transactional actions (apply, pay, accept, withdraw) */
        accent: "bg-accent text-accent-foreground hover:bg-cobalt-deep font-semibold",
        hero: "bg-primary text-primary-foreground hover:bg-primary-deep font-bold text-lg px-[30px] py-[14px]",
        "icon-circular": "rounded-full bg-background text-foreground h-10 w-10",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        type={asChild ? undefined : type ?? "button"}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
