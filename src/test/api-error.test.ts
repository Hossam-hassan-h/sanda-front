import { describe, expect, it } from "vitest";

import { getApiErrorMessage, normalizeApiError } from "@/lib/api-error";

const axiosError = (status: number | undefined, data?: unknown) => ({
  isAxiosError: true,
  response: status ? { status, data } : undefined,
  code: status ? undefined : "ERR_NETWORK",
});

describe("api error helper", () => {
  it("uses backend message", () => {
    expect(getApiErrorMessage(axiosError(400, { message: "Invalid email" }), "Fallback")).toBe("Invalid email");
  });

  it("handles Axios network errors", () => {
    expect(getApiErrorMessage(axiosError(undefined), "Fallback")).toBe("Network error. Please check your connection.");
  });

  it("extracts validation field errors", () => {
    const result = normalizeApiError(axiosError(400, { message: "Validation Error", errors: [{ path: ["email"], message: "Invalid email" }] }));
    expect(result.fieldErrors).toEqual({ email: "Invalid email" });
  });

  it("normalizes conflict errors", () => {
    expect(getApiErrorMessage(axiosError(409, { message: "Email already exists" }), "Fallback")).toBe("Email already exists");
  });

  it("uses fallback for unknown errors", () => {
    expect(getApiErrorMessage({}, "Fallback")).toBe("Fallback");
  });

  it("does not expose internal details", () => {
    expect(getApiErrorMessage(axiosError(500, { message: "MongoDB duplicate key stack trace" }), "Fallback")).toBe("Server error. Please try again later.");
  });
});
