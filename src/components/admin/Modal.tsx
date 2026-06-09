import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  size?: "sm" | "md" | "lg" | "xl";
  children: ReactNode;
}

const sizeClasses = {
  sm: "max-w-[calc(100vw-2rem)] sm:max-w-sm",
  md: "max-w-[calc(100vw-2rem)] sm:max-w-md",
  lg: "max-w-[calc(100vw-2rem)] sm:max-w-lg",
  xl: "max-w-[calc(100vw-2rem)] sm:max-w-2xl",
};

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  size = "md",
  children,
}: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`mx-4 sm:mx-auto ${sizeClasses[size]}`}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
