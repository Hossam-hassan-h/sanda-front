import { toast as sonnerToast } from "sonner";
import type { ReactNode } from "react";

type ToastVariant = "default" | "destructive";

type ToastInput = {
  title?: ReactNode;
  description?: ReactNode;
  variant?: ToastVariant;
};

function renderMessage({ title, description }: ToastInput) {
  if (title && description) {
    return { message: title, options: { description } };
  }
  return { message: title || description || "", options: undefined };
}

function toast(input: ToastInput) {
  const { message, options } = renderMessage(input);
  if (!message) return "";
  if (input.variant === "destructive") {
    return sonnerToast.error(message, options);
  }
  return sonnerToast.success(message, options);
}

function useToast() {
  return {
    toast,
    dismiss: sonnerToast.dismiss,
    toasts: [],
  };
}

export { useToast, toast };
