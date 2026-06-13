import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PasswordInput from "@/components/common/PasswordInput";
import Feedback from "@/components/common/Feedback";
import FormSubmitButton from "@/components/common/FormSubmitButton";
import { getApiErrorMessage } from "@/lib/get-api-error-message";

describe("PasswordInput", () => {
  it("hides password by default", () => {
    render(<PasswordInput data-testid="pw" />);
    const input = screen.getByTestId("pw");
    expect(input).toHaveAttribute("type", "password");
  });

  it("shows password when Eye button is clicked", () => {
    render(<PasswordInput data-testid="pw" />);
    const toggle = screen.getByRole("button");
    fireEvent.click(toggle);
    expect(screen.getByTestId("pw")).toHaveAttribute("type", "text");
  });

  it("hides password when EyeOff button is clicked", () => {
    render(<PasswordInput data-testid="pw" />);
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByTestId("pw")).toHaveAttribute("type", "password");
  });

  it("toggle button has type button", () => {
    render(<PasswordInput />);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("toggle does not submit parent form", () => {
    const onSubmit = vi.fn();
    render(
      <form onSubmit={onSubmit}>
        <PasswordInput />
      </form>
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("has accessible label and aria-pressed attribute", () => {
    render(<PasswordInput />);
    const toggle = screen.getByRole("button");
    expect(toggle).toHaveAttribute("aria-label", "إظهار أو إخفاء كلمة المرور");
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(toggle);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("shows custom toggle label when provided", () => {
    render(<PasswordInput toggleLabel="Show/Hide" />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Show/Hide");
  });

  it("renders leading lock icon when showLeadingIcon is true", () => {
    const { container } = render(<PasswordInput showLeadingIcon />);
    expect(container.querySelector(".lucide-lock")).toBeInTheDocument();
  });

  it("disabled toggle does not toggle visibility", () => {
    render(<PasswordInput data-testid="pw" disabled />);
    const toggle = screen.getByRole("button");
    expect(toggle).toBeDisabled();
    fireEvent.click(toggle);
    expect(screen.getByTestId("pw")).toHaveAttribute("type", "password");
  });

  it("disabled input prevents interaction", () => {
    render(<PasswordInput data-testid="pw" disabled />);
    expect(screen.getByTestId("pw")).toBeDisabled();
  });
});

describe("Feedback", () => {
  it("renders null when no message", () => {
    const { container } = render(<Feedback />);
    expect(container.firstChild).toBeNull();
  });

  it("renders null when message is null", () => {
    const { container } = render(<Feedback message={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders null when message is empty string", () => {
    const { container } = render(<Feedback message="" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders error message", () => {
    render(<Feedback message="حدث خطأ" />);
    expect(screen.getByText("حدث خطأ")).toBeInTheDocument();
  });

  it("error has role alert", () => {
    render(<Feedback message="خطأ" variant="error" />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("success variant has role status", () => {
    render(<Feedback message="تم بنجاح" variant="success" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("warning variant has role status", () => {
    render(<Feedback message="تحذير" variant="warning" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("info variant has role status", () => {
    render(<Feedback message="معلومات" variant="info" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders success icon for success variant", () => {
    const { container } = render(<Feedback message="OK" variant="success" />);
    expect(container.querySelector(".lucide-circle-check")).toBeInTheDocument();
  });

  it("renders error icon for error variant", () => {
    const { container } = render(<Feedback message="Err" variant="error" />);
    expect(container.querySelector(".lucide-circle-alert")).toBeInTheDocument();
  });

  it("renders warning icon for warning variant", () => {
    const { container } = render(<Feedback message="Warn" variant="warning" />);
    expect(container.querySelector(".lucide-triangle-alert")).toBeInTheDocument();
  });

  it("renders info icon for info variant", () => {
    const { container } = render(<Feedback message="Info" variant="info" />);
    expect(container.querySelector(".lucide-info")).toBeInTheDocument();
  });

  it("accepts custom className", () => {
    const { container } = render(<Feedback message="test" className="my-custom-class" />);
    expect(container.firstChild).toHaveClass("my-custom-class");
  });

  it("has aria-live polite", () => {
    render(<Feedback message="test" />);
    expect(screen.getByRole("alert")).toHaveAttribute("aria-live", "polite");
  });
});

describe("FormSubmitButton", () => {
  it("renders children in normal state", () => {
    render(<FormSubmitButton>إرسال</FormSubmitButton>);
    const btn = screen.getByRole("button", { name: "إرسال" });
    expect(btn).toBeInTheDocument();
    expect(btn).not.toBeDisabled();
  });

  it("has type submit by default", () => {
    render(<FormSubmitButton>إرسال</FormSubmitButton>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });

  it("disables button when pending", () => {
    render(<FormSubmitButton pending>إرسال</FormSubmitButton>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("shows pending label when pending", () => {
    render(<FormSubmitButton pending pendingLabel="جارٍ الإرسال...">إرسال</FormSubmitButton>);
    expect(screen.getByRole("button", { name: "جارٍ الإرسال..." })).toBeInTheDocument();
  });

  it("shows loading spinner when pending", () => {
    const { container } = render(<FormSubmitButton pending>إرسال</FormSubmitButton>);
    expect(container.querySelector(".lucide-loader-circle")).toBeInTheDocument();
  });

  it("shows children as fallback pending label when pendingLabel omitted", () => {
    render(<FormSubmitButton pending>إرسال</FormSubmitButton>);
    expect(screen.getByRole("button", { name: "إرسال" })).toBeInTheDocument();
  });

  it("disables when disabled prop is true", () => {
    render(<FormSubmitButton disabled>إرسال</FormSubmitButton>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("disables when both disabled and pending", () => {
    render(<FormSubmitButton disabled pending>إرسال</FormSubmitButton>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("applies className", () => {
    const { container } = render(<FormSubmitButton className="my-btn">إرسال</FormSubmitButton>);
    expect(container.firstChild).toHaveClass("my-btn");
  });
});

describe("getApiErrorMessage", () => {
  it("extracts backend message from response.data.message", () => {
    const error = { response: { status: 400, data: { message: "البريد موجود بالفعل" } } };
    expect(getApiErrorMessage(error)).toBe("البريد موجود بالفعل");
  });

  it("extracts backend error from response.data.error", () => {
    const error = { response: { status: 422, data: { error: "خطأ في التحقق" } } };
    expect(getApiErrorMessage(error)).toBe("خطأ في التحقق");
  });

  it("extracts validation error from response.data.errors array", () => {
    const error = { response: { status: 422, data: { errors: ["الحقل الأول مطلوب", "الحقل الثاني مطلوب"] } } };
    expect(getApiErrorMessage(error)).toBe("الحقل الأول مطلوب");
  });

  it("extracts nested validation error from response.data.errors object", () => {
    const error = { response: { status: 422, data: { errors: { email: "البريد الإلكتروني غير صحيح" } } } };
    expect(getApiErrorMessage(error)).toBe("البريد الإلكتروني غير صحيح");
  });

  it("extracts from response.data.details", () => {
    const error = { response: { status: 409, data: { details: ["عنوان موجود بالفعل"] } } };
    expect(getApiErrorMessage(error)).toBe("عنوان موجود بالفعل");
  });

  it("returns status-based fallback for 401", () => {
    const error = { response: { status: 401 } };
    expect(getApiErrorMessage(error)).toBe("انتهت الجلسة أو بيانات الدخول غير صحيحة.");
  });

  it("returns status-based fallback for 403", () => {
    const error = { response: { status: 403 } };
    expect(getApiErrorMessage(error)).toBe("ليس لديك صلاحية لتنفيذ هذا الإجراء.");
  });

  it("returns status-based fallback for 404", () => {
    const error = { response: { status: 404 } };
    expect(getApiErrorMessage(error)).toBe("المورد المطلوب غير موجود.");
  });

  it("returns status-based fallback for 429", () => {
    const error = { response: { status: 429 } };
    expect(getApiErrorMessage(error)).toBe("محاولات كثيرة. حاول مرة أخرى بعد قليل.");
  });

  it("returns generic message for 500+", () => {
    const error = { response: { status: 500 } };
    expect(getApiErrorMessage(error)).toBe("الخدمة غير متاحة مؤقتا. حاول مرة أخرى لاحقا.");
  });

  it("returns network error message when request exists but no response", () => {
    const error = { request: {} };
    expect(getApiErrorMessage(error)).toBe("تعذر الاتصال بالخادم. تحقق من اتصال الإنترنت.");
  });

  it("returns timeout message when code is ECONNABORTED", () => {
    const error = { code: "ECONNABORTED" };
    expect(getApiErrorMessage(error)).toBe("انتهت مهلة الاتصال. حاول مرة أخرى.");
  });

  it("returns safe error.message for plain errors", () => {
    const error = new Error("Something went wrong");
    expect(getApiErrorMessage(error)).toBe("Something went wrong");
  });

  it("returns fallback for unknown errors", () => {
    expect(getApiErrorMessage(null)).toBe("حدث خطأ غير متوقع. حاول مرة أخرى.");
  });

  it("returns custom fallback when provided", () => {
    const error = { unexpected: true };
    expect(getApiErrorMessage(error, "مخصص")).toBe("مخصص");
  });

  it("does not expose HTML in error message", () => {
    const error = { response: { status: 500, data: { message: "<script>alert('xss')</script>" } } };
    expect(getApiErrorMessage(error)).toBe("الخدمة غير متاحة مؤقتا. حاول مرة أخرى لاحقا.");
  });

  it("does not expose internal keywords in error message", () => {
    const error = new Error("MongoError: duplicate key");
    expect(getApiErrorMessage(error)).toBe("حدث خطأ غير متوقع. حاول مرة أخرى.");
  });
});
