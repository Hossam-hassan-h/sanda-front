import axios from "axios";

const DEFAULT_ERROR_MESSAGE = "Something went wrong. Please try again.";

type BackendValidationError =
  | string
  | {
      message?: string;
      msg?: string;
      path?: string;
      field?: string;
    };

interface BackendErrorBody {
  message?: string;
  error?: string;
  errors?: BackendValidationError[] | Record<string, BackendValidationError | BackendValidationError[]>;
}

const STATUS_MESSAGES: Record<number, string> = {
  400: "Please check the submitted information.",
  401: "Please sign in again to continue.",
  403: "You do not have permission to complete this action.",
  404: "The requested item was not found.",
  409: "This request conflicts with existing data.",
  422: "Please check the highlighted fields.",
  429: "Too many requests. Please wait and try again.",
};

const isPublicMessage = (message: string) => {
  const lower = message.toLowerCase();
  return ![
    "stack",
    "trace",
    "exception",
    "syntaxerror",
    "typeerror",
    "referenceerror",
    "network error",
    "timeout of",
  ].some((term) => lower.includes(term));
};

const firstValidationMessage = (errors: BackendErrorBody["errors"]) => {
  if (!errors) return undefined;

  const values = Array.isArray(errors) ? errors : Object.values(errors).flat();
  for (const item of values) {
    if (typeof item === "string" && item.trim()) return item;
    if (item && typeof item === "object") {
      const message = item.message || item.msg;
      if (message?.trim()) return message;
    }
  }

  return undefined;
};

export const getApiErrorMessage = (error: unknown, fallback = DEFAULT_ERROR_MESSAGE) => {
  if (axios.isAxiosError<BackendErrorBody>(error)) {
    if (error.code === "ECONNABORTED" || error.message.toLowerCase().includes("timeout")) {
      return "The request timed out. Please try again.";
    }

    if (!error.response) {
      return "Unable to reach the server. Check your connection and try again.";
    }

    const { status, data } = error.response;
    const validationMessage = firstValidationMessage(data?.errors);
    const responseMessage = data?.message === "Validation Error" ? validationMessage : data?.message || data?.error;

    if (responseMessage?.trim() && isPublicMessage(responseMessage)) return responseMessage;
    if (validationMessage?.trim() && isPublicMessage(validationMessage)) return validationMessage;
    if (status >= 500) return "The server could not complete the request. Please try again later.";

    return STATUS_MESSAGES[status] || fallback;
  }

  if (error instanceof DOMException && error.name === "NotAllowedError") {
    return "Permission was denied. Update your browser settings and try again.";
  }

  if (error instanceof Error && isPublicMessage(error.message)) {
    return error.message;
  }

  return fallback;
};
