import { isAxiosError } from "axios";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";

export type ApiErrorResult = {
  message: string;
  fieldErrors?: Record<string, string>;
};

const DEFAULT_MESSAGE = "Something went wrong. Please try again.";
const INTERNAL_PATTERNS = [/mongodb/i, /mongoose/i, /duplicate key/i, /e11000/i, /stack/i, /bearer\s+[a-z0-9._-]+/i, /<html/i, /doctype html/i];

function isSafeMessage(message: unknown): message is string {
  if (typeof message !== "string") return false;
  const trimmed = message.trim();
  return Boolean(trimmed) && !INTERNAL_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function safeMessage(message: unknown, fallback: string) {
  return isSafeMessage(message) ? message.trim() : fallback;
}

function normalizeFieldName(path: unknown) {
  if (Array.isArray(path)) return path.join(".");
  if (typeof path === "string") return path;
  return "";
}

function extractFieldErrors(payload: unknown): Record<string, string> | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const data = payload as Record<string, unknown>;
  const result: Record<string, string> = {};
  const collect = (entry: unknown) => {
    if (!entry || typeof entry !== "object") return;
    const item = entry as Record<string, unknown>;
    const field = normalizeFieldName(item.path ?? item.field ?? item.param ?? item.name);
    const message = safeMessage(item.message ?? item.msg, "");
    if (field && message) result[field] = message;
  };

  if (Array.isArray(data.errors)) data.errors.forEach(collect);
  if (Array.isArray(data.issues)) data.issues.forEach(collect);
  if (data.errors && typeof data.errors === "object" && !Array.isArray(data.errors)) {
    Object.entries(data.errors as Record<string, unknown>).forEach(([field, value]) => {
      if (typeof value === "string") result[field] = safeMessage(value, "");
      else if (value && typeof value === "object") {
        const message = safeMessage((value as Record<string, unknown>).message, "");
        if (message) result[field] = message;
      }
    });
  }

  return Object.keys(result).length ? result : undefined;
}

export function normalizeApiError(error: unknown, fallbackMessage = DEFAULT_MESSAGE): ApiErrorResult {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data;
    const fieldErrors = extractFieldErrors(data);
    const responseMessage = data && typeof data === "object" ? (data as Record<string, unknown>).message : undefined;

    if (!error.response) {
      return {
        message: error.code === "ECONNABORTED" ? "Request timed out. Please try again." : "Network error. Please check your connection.",
        fieldErrors,
      };
    }
    if (status === 401) return { message: safeMessage(responseMessage, "You are not authorized. Please sign in again."), fieldErrors };
    if (status === 403) return { message: safeMessage(responseMessage, "You do not have permission to perform this action."), fieldErrors };
    if (status === 409) return { message: safeMessage(responseMessage, "This record already exists."), fieldErrors };
    if (status && status >= 500) return { message: safeMessage(responseMessage, "Server error. Please try again later."), fieldErrors };
    return { message: safeMessage(responseMessage, fallbackMessage), fieldErrors };
  }

  if (error instanceof Error) return { message: safeMessage(error.message, fallbackMessage) };
  return { message: fallbackMessage };
}

export function getApiErrorMessage(error: unknown, fallbackMessage = DEFAULT_MESSAGE) {
  return normalizeApiError(error, fallbackMessage).message;
}

export function getApiFieldErrors(error: unknown) {
  return normalizeApiError(error).fieldErrors;
}

export function applyApiErrorsToForm<TValues extends FieldValues>(
  error: unknown,
  form: UseFormReturn<TValues>,
  fallbackMessage = DEFAULT_MESSAGE,
) {
  const result = normalizeApiError(error, fallbackMessage);
  Object.entries(result.fieldErrors || {}).forEach(([field, message]) => {
    form.setError(field as Path<TValues>, { type: "server", message });
  });
  return result.message;
}
