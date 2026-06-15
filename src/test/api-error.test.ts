import { describe, expect, it } from "vitest";
import { AxiosError } from "axios";
import { getApiErrorMessage } from "@/lib/api-error";

const axiosError = (status: number, data?: unknown) =>
  new AxiosError("Request failed", undefined, undefined, undefined, {
    status,
    statusText: "Error",
    headers: {},
    config: { headers: {} },
    data,
  });

describe("getApiErrorMessage", () => {
  it("uses backend validation messages", () => {
    const error = axiosError(422, {
      message: "Validation Error",
      errors: [{ message: "Email is required" }],
    });

    expect(getApiErrorMessage(error)).toBe("Email is required");
  });

  it("maps common authorization statuses", () => {
    expect(getApiErrorMessage(axiosError(403))).toBe("You do not have permission to complete this action.");
  });

  it("does not expose internal error details", () => {
    expect(getApiErrorMessage(new Error("TypeError: Cannot read properties of undefined"))).toBe(
      "Something went wrong. Please try again.",
    );
  });
});
