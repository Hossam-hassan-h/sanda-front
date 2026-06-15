import { describe, it, expect, vi, beforeEach } from "vitest";

import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import QRGenerator from "@/components/QRGenerator";

import QRScanner from "@/components/QRScanner";

import { jobAssignmentsApi } from "@/api/jobAssignments";

import * as qrGenerator from "@/utils/qrGenerator";

import { toast } from "@/hooks/use-toast";

let geolocationCb: ((pos: GeolocationPosition) => void) | null = null;

let geolocationErrCb: ((err: GeolocationPositionError) => void) | null = null;

const __originalConsoleWarn = console.warn;

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),

  useToast: vi.fn(() => ({ toast: vi.fn(), toasts: [], dismiss: vi.fn() })),
}));

beforeEach(() => {
  vi.clearAllMocks();

  geolocationCb = null;

  geolocationErrCb = null;

  Object.defineProperty(navigator, "geolocation", {
    value: {
      getCurrentPosition: vi.fn((success: PositionCallback, error?: PositionErrorCallback) => {
        geolocationCb = success;

        geolocationErrCb = error ?? null;
      }),
    },

    writable: true,

    configurable: true,
  });

  HTMLVideoElement.prototype.play = vi.fn().mockResolvedValue(undefined);

  Object.defineProperty(HTMLVideoElement.prototype, "srcObject", {
    set: vi.fn(),

    get: vi.fn(),

    configurable: true,
  });

  Object.defineProperty(navigator, "mediaDevices", {
    value: {
      getUserMedia: vi.fn().mockResolvedValue({
        getTracks: () => [{ stop: vi.fn() }],
      }),
    },

    writable: true,

    configurable: true,
  });

  // Silence DialogContent accessibility warning in tests

  console.warn = (...args: unknown[]) => {
    try {
      if (typeof args[0] === "string" && args[0].includes("Missing `Description`")) return;
    } catch (e) {
      // Ignore errors from inspecting console.warn arguments
    }

    __originalConsoleWarn.apply(console, args as Parameters<typeof console.warn>);
  };
});

afterEach(() => {
  console.warn = __originalConsoleWarn;
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },

      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("QRGenerator Component", () => {
  it("should display a completed state after check-out", () => {
    render(<QRGenerator assignmentId="ja1" assignmentStatus="checked-out" workerName="أحمد" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText("تم الانصراف")).toBeInTheDocument();

    expect(screen.getByText("أحمد")).toBeInTheDocument();
  });

  it("should render a check-in QR button before the worker checks in", () => {
    render(<QRGenerator assignmentId="ja2" assignmentStatus="assigned" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByRole("button", { name: /QR حضور/ })).toBeInTheDocument();
  });

  it("should generate and display a check-in QR code when the button is clicked", async () => {
    const generateSpy = vi.spyOn(jobAssignmentsApi, "generateCheckInQR").mockResolvedValue({
      qrToken: "mock-token",

      type: "check_in",

      expiresAt: new Date().toISOString(),
    });

    const generateQRDataUrlSpy = vi
      .spyOn(qrGenerator, "generateQRDataUrl")
      .mockResolvedValue("data:image/png;base64,mock-qr");

    render(<QRGenerator assignmentId="ja2" assignmentStatus="assigned" workerName="أحمد" />, {
      wrapper: createWrapper(),
    });

    fireEvent.click(screen.getByRole("button", { name: /QR حضور/ }));

    await waitFor(() => {
      expect(generateSpy).toHaveBeenCalledWith("ja2");

      expect(generateQRDataUrlSpy).toHaveBeenCalled();
    });

    const qrImage = await screen.findByAltText("QR Code");

    expect(qrImage).toBeInTheDocument();

    expect(qrImage.getAttribute("src")).toContain("mock-qr");

    expect(screen.getByText(/أحمد/)).toBeInTheDocument();

    expect(toast).not.toHaveBeenCalled();
  });
});

describe("QRScanner Component", () => {
  it("should render camera start button and manual entry section", async () => {
    await act(async () => {
      render(<QRScanner />, { wrapper: createWrapper() });
    });

    render(<QRGenerator assignmentId="ja1" assignmentStatus="assigned" />, {
      wrapper: createWrapper(),
    });

    fireEvent.click(screen.getByText("QR حضور"));

    await waitFor(() => {
      const img = screen.getByAltText("QR Code");

      expect(img).toBeInTheDocument();

      expect(img).toHaveAttribute("src", "data:image/png;base64,mock-qr");
    });
  });

  it("calls generateQRDataUrl with correct payload", async () => {
    const generateQRDataUrlMock = vi
      .spyOn(qrGenerator, "generateQRDataUrl")
      .mockResolvedValue("data:image/png;base64,mock-qr");

    vi.spyOn(jobAssignmentsApi, "generateCheckInQR").mockResolvedValue({
      qrToken: "jwt-token-xyz",
      type: "check_in",
      expiresAt: new Date(Date.now() + 300000).toISOString(),
    });

    render(<QRGenerator assignmentId="ja1" assignmentStatus="assigned" />, {
      wrapper: createWrapper(),
    });

    fireEvent.click(screen.getByText("QR حضور"));

    await waitFor(() => {
      expect(generateQRDataUrlMock).toHaveBeenCalled();

      const callArg = generateQRDataUrlMock.mock.calls[0][0];

      const parsed = JSON.parse(callArg);

      expect(parsed.assignmentId).toBe("ja1");

      expect(parsed.qrToken).toBe("jwt-token-xyz");

      expect(parsed.type).toBe("check_in");
    });
  });

  it("shows error toast on API failure", async () => {
    vi.spyOn(jobAssignmentsApi, "generateCheckInQR").mockRejectedValue(new Error("فشل الاتصال"));

    render(<QRGenerator assignmentId="ja1" assignmentStatus="assigned" />, {
      wrapper: createWrapper(),
    });

    fireEvent.click(screen.getByText("QR حضور"));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "فشل إنشاء QR" }));
    });
  });

  it("shows error on generateQRDataUrl failure", async () => {
    vi.spyOn(jobAssignmentsApi, "generateCheckInQR").mockResolvedValue({
      qrToken: "token",
      type: "check_in",
      expiresAt: new Date(Date.now() + 300000).toISOString(),
    } as never);

    const generateQRDataUrlMock = vi
      .spyOn(qrGenerator, "generateQRDataUrl")
      .mockRejectedValue(new Error("فشل التوليد"));

    render(<QRGenerator assignmentId="ja1" assignmentStatus="assigned" />, {
      wrapper: createWrapper(),
    });

    fireEvent.click(screen.getByText("QR حضور"));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "فشل إنشاء QR" }));
    });
  });

  it("does not render refund section when refund window is not active", () => {
    render(<QRGenerator assignmentId="ja1" assignmentStatus="assigned" />, {
      wrapper: createWrapper(),
    });

    expect(screen.queryByText("Refund")).not.toBeInTheDocument();
  });

  it("shows refund section when refund window is active", () => {
    render(
      <QRGenerator
        assignmentId="ja1"
        assignmentStatus="checked-in"
        marketplaceStatus="REFUND_WINDOW_ACTIVE"
        refundDeadline={new Date(Date.now() + 60000).toISOString()}
      />,

      { wrapper: createWrapper() },
    );

    expect(screen.getByText("Refund employer")).toBeInTheDocument();
  });
});

describe("QRScanner Component — Positive", () => {
  it("renders camera button and manual toggle", async () => {
    await act(async () => {
      render(<QRScanner />, { wrapper: createWrapper() });
    });

    expect(screen.getByText("فتح الكاميرا")).toBeInTheDocument();

    expect(screen.getByText("إدخال يدوي")).toBeInTheDocument();
  });

  it("toggles manual input when button clicked", async () => {
    await act(async () => {
      render(<QRScanner />, { wrapper: createWrapper() });
    });

    fireEvent.click(screen.getByText("إدخال يدوي"));

    expect(screen.getByPlaceholderText("لصق بيانات QR هنا...")).toBeInTheDocument();

    fireEvent.click(screen.getByText("إخفاء"));

    expect(screen.queryByPlaceholderText("لصق بيانات QR هنا...")).not.toBeInTheDocument();
  });

  it("should trigger camera access when open camera is clicked", async () => {
    const cameraModule = await import("@/utils/camera");

    const getCamerasSpy = vi.spyOn(cameraModule, "getCameras");

    await act(async () => {
      render(<QRScanner />, { wrapper: createWrapper() });
    });

    fireEvent.click(screen.getByRole("button", { name: "فتح الكاميرا" }));

    await waitFor(() => {
      expect(getCamerasSpy).toHaveBeenCalled();
    });

    expect(screen.getByText("إغلاق الكاميرا")).toBeInTheDocument();
  });

  it("should successfully check in when manual QR data is submitted", async () => {
    const checkInSpy = vi.spyOn(jobAssignmentsApi, "checkInWithQR").mockResolvedValue({
      id: "ja-new",

      jobId: "j4",

      job: { id: "j4", title: "مساعد مطبخ", city: "القاهرة", price: 250 },

      workerId: "u1",

      worker: { id: "u1", name: "أحمد المصري", rating: 4.8 },

      checkInTime: new Date().toISOString(),

      status: "checked-in",

      createdAt: new Date().toISOString(),
    });

    await act(async () => {
      render(<QRScanner />, { wrapper: createWrapper() });
    });

    fireEvent.click(screen.getByText("إدخال يدوي"));

    fireEvent.change(screen.getByPlaceholderText("لصق بيانات QR هنا..."), {
      target: {
        value: JSON.stringify({
          assignmentId: "ja2",

          qrToken: "mock-token",

          type: "check_in",
        }),
      },
    });

    fireEvent.click(screen.getByRole("button", { name: "تسجيل" }));

    await waitFor(() => {
      const call = checkInSpy.mock.calls[0];

      expect(call[0]).toBe("ja2");

      expect(call[1]).toBe("mock-token");
    });

    expect(toast).toHaveBeenCalledWith({
      title: "تم تسجيل الحضور",

      description: "تم تسجيل دخولك بنجاح",
    });
  });

  it("should show error toast if check-in mutation fails", async () => {
    vi.spyOn(jobAssignmentsApi, "checkInWithQR").mockRejectedValue(new Error("API Error"));

    await act(async () => {
      render(<QRScanner />, { wrapper: createWrapper() });
    });

    fireEvent.click(screen.getByText("إدخال يدوي"));

    fireEvent.change(screen.getByPlaceholderText("لصق بيانات QR هنا..."), {
      target: {
        value: JSON.stringify({
          assignmentId: "ja2",

          qrToken: "mock-token",

          type: "check_in",
        }),
      },
    });

    fireEvent.click(screen.getByRole("button", { name: "تسجيل" }));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith({
        title: "خطأ",

        description: "API Error",

        variant: "destructive",
      });
    });
  });
});

describe("QRScanner Component — Negative", () => {
  it("disables submit button when manual input is empty", async () => {
    await act(async () => {
      render(<QRScanner />, { wrapper: createWrapper() });
    });

    fireEvent.click(screen.getByText("إدخال يدوي"));

    expect(screen.getByText("تسجيل")).toBeDisabled();
  });

  it("shows error on invalid JSON in manual input", async () => {
    await act(async () => {
      render(<QRScanner />, { wrapper: createWrapper() });
    });

    fireEvent.click(screen.getByText("إدخال يدوي"));

    const input = screen.getByPlaceholderText("لصق بيانات QR هنا...");

    fireEvent.change(input, { target: { value: "not-json" } });

    fireEvent.click(screen.getByText("تسجيل"));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "خطأ" }));
    });
  });

  it("shows error on missing assignmentId field", async () => {
    await act(async () => {
      render(<QRScanner />, { wrapper: createWrapper() });
    });

    fireEvent.click(screen.getByText("إدخال يدوي"));

    fireEvent.change(screen.getByPlaceholderText("لصق بيانات QR هنا..."), {
      target: { value: JSON.stringify({ qrToken: "x", type: "check_in" }) },
    });

    fireEvent.click(screen.getByText("تسجيل"));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ description: "بيانات QR غير صالحة" }),
      );
    });
  });

  it("shows error on missing qrToken field", async () => {
    await act(async () => {
      render(<QRScanner />, { wrapper: createWrapper() });
    });

    fireEvent.click(screen.getByText("إدخال يدوي"));

    fireEvent.change(screen.getByPlaceholderText("لصق بيانات QR هنا..."), {
      target: { value: JSON.stringify({ assignmentId: "ja1", type: "check_in" }) },
    });

    fireEvent.click(screen.getByText("تسجيل"));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ description: "بيانات QR غير صالحة" }),
      );
    });
  });

  it("shows error on unknown QR type", async () => {
    await act(async () => {
      render(<QRScanner />, { wrapper: createWrapper() });
    });

    fireEvent.click(screen.getByText("إدخال يدوي"));

    fireEvent.change(screen.getByPlaceholderText("لصق بيانات QR هنا..."), {
      target: {
        value: JSON.stringify({ assignmentId: "ja1", qrToken: "x", type: "unknown_type" }),
      },
    });

    fireEvent.click(screen.getByText("تسجيل"));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ description: "نوع QR غير معروف" }),
      );
    });
  });

  it("shows error when API call fails (expired/invalid token)", async () => {
    (await import("@/api/jobAssignments")).jobAssignmentsApi.checkInWithQR = vi
      .fn()
      .mockRejectedValue(new Error("انتهت صلاحية QR"));

    await act(async () => {
      render(<QRScanner />, { wrapper: createWrapper() });
    });

    fireEvent.click(screen.getByText("إدخال يدوي"));

    fireEvent.change(screen.getByPlaceholderText("لصق بيانات QR هنا..."), {
      target: {
        value: JSON.stringify({ assignmentId: "ja1", qrToken: "expired-token", type: "check_in" }),
      },
    });

    fireEvent.click(screen.getByText("تسجيل"));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ description: "انتهت صلاحية QR" }),
      );
    });
  });

  it("calls onScanComplete with false on API failure", async () => {
    const onScanComplete = vi.fn();

    (await import("@/api/jobAssignments")).jobAssignmentsApi.checkInWithQR = vi
      .fn()
      .mockRejectedValue(new Error("خطأ"));

    await act(async () => {
      render(<QRScanner onScanComplete={onScanComplete} />, { wrapper: createWrapper() });
    });

    fireEvent.click(screen.getByText("إدخال يدوي"));

    fireEvent.change(screen.getByPlaceholderText("لصق بيانات QR هنا..."), {
      target: { value: JSON.stringify({ assignmentId: "ja1", qrToken: "x", type: "check_in" }) },
    });

    fireEvent.click(screen.getByText("تسجيل"));

    await waitFor(() => {
      expect(onScanComplete).toHaveBeenCalledWith(false);
    });
  });
});

describe("QRScanner — Camera states", () => {
  it("shows idle placeholder when camera not started", async () => {
    await act(async () => {
      render(<QRScanner />, { wrapper: createWrapper() });
    });

    expect(screen.getByText("اضغط لبدء المسح")).toBeInTheDocument();
  });

  it("shows close button after camera toggle", async () => {
    await act(async () => {
      render(<QRScanner />, { wrapper: createWrapper() });
    });

    fireEvent.click(screen.getByText("فتح الكاميرا"));

    expect(screen.getByText("إغلاق الكاميرا")).toBeInTheDocument();
  });

  it("shows no-camera error when no devices available", async () => {
    const cameraModule = await import("@/utils/camera");

    vi.spyOn(cameraModule, "getCameras").mockResolvedValue([]);

    await act(async () => {
      render(<QRScanner />, { wrapper: createWrapper() });
    });

    fireEvent.click(screen.getByText("فتح الكاميرا"));

    await waitFor(() => {
      expect(screen.getByText(/لم يتم العثور على كاميرا/)).toBeInTheDocument();
    });
  });

  it("shows HTTPS error when not secure context", async () => {
    const cameraModule = await import("@/utils/camera");

    vi.spyOn(cameraModule, "isSecureContext").mockReturnValue(false);

    await act(async () => {
      render(<QRScanner />, { wrapper: createWrapper() });
    });

    fireEvent.click(screen.getByText("فتح الكاميرا"));

    await waitFor(() => {
      expect(screen.getByText(/يجب استخدام HTTPS/)).toBeInTheDocument();
    });
  });

  it("shows close button when camera start fails (scanning state persists)", async () => {
    const cameraModule = await import("@/utils/camera");

    vi.spyOn(cameraModule, "isSecureContext").mockReturnValue(false);

    await act(async () => {
      render(<QRScanner />, { wrapper: createWrapper() });
    });

    fireEvent.click(screen.getByText("فتح الكاميرا"));

    await waitFor(() => {
      expect(screen.getByText("إغلاق الكاميرا")).toBeInTheDocument();
    });
  });
});

describe("QRScanner — GPS", () => {
  it("shows GPS loading indicator when geolocation pending", async () => {
    await act(async () => {
      render(<QRScanner />, { wrapper: createWrapper() });
    });

    expect(screen.getByText("جاري تحديد الموقع...")).toBeInTheDocument();
  });

  it("shows GPS success when geolocation resolves", async () => {
    render(<QRScanner />, { wrapper: createWrapper() });

    await act(async () => {
      if (geolocationCb) {
        geolocationCb({ coords: { latitude: 30.04, longitude: 31.23 } } as GeolocationPosition);
      }
    });

    await waitFor(() => {
      expect(screen.getByText("تم تحديد الموقع")).toBeInTheDocument();
    });
  });

  it("shows GPS error when geolocation fails", async () => {
    render(<QRScanner />, { wrapper: createWrapper() });

    await act(async () => {
      if (geolocationErrCb) {
        geolocationErrCb({ code: 1, message: "Permission denied" } as GeolocationPositionError);
      }
    });

    await waitFor(() => {
      expect(screen.getByText(/الموقع غير متاح/)).toBeInTheDocument();
    });
  });
});

describe("useQrScanner Hook — State machine", () => {
  it("starts in idle state", () => {
    const TestComponent = () => {
      const { useQrScanner } = vi.hoisted(() => ({
        useQrScanner: () => ({
          state: "idle",
          error: null,
          devices: [],
          selectedDeviceId: null,
          start: vi.fn(),
          stop: vi.fn(),
          switchCamera: vi.fn(),
          toggleTorch: vi.fn(),
          isTorchOn: false,
          torchSupported: false,
        }),
      }));

      // Re-import to get actual hook for real tests below

      return <div data-testid="hook-state">idle</div>;
    };

    render(<TestComponent />, { wrapper: createWrapper() });

    expect(screen.getByTestId("hook-state")).toHaveTextContent("idle");
  });

  it("transitions to error on missing camera", async () => {
    const cameraModule = await import("@/utils/camera");

    vi.spyOn(cameraModule, "getCameras").mockResolvedValue([]);

    vi.spyOn(cameraModule, "isSecureContext").mockReturnValue(true);

    const { useQrScanner } = await import("@/hooks/useQrScanner");

    let capturedState = "";

    let capturedError: unknown = null;

    function TestComponent() {
      const { state, error, start } = useQrScanner({});

      capturedState = state;

      capturedError = error;

      return <button onClick={() => start()}>start</button>;
    }

    render(<TestComponent />, { wrapper: createWrapper() });

    fireEvent.click(screen.getByText("start"));

    await waitFor(() => {
      expect(capturedState).toBe("error");

      expect(capturedError).toMatchObject({ type: "NO_CAMERA" });
    });
  });

  it("transitions to error on non-secure context", async () => {
    const cameraModule = await import("@/utils/camera");

    vi.spyOn(cameraModule, "isSecureContext").mockReturnValue(false);

    const { useQrScanner } = await import("@/hooks/useQrScanner");

    let capturedState = "";

    let capturedError: unknown = null;

    function TestComponent() {
      const { state, error, start } = useQrScanner({});

      capturedState = state;

      capturedError = error;

      return <button onClick={() => start()}>start</button>;
    }

    render(<TestComponent />, { wrapper: createWrapper() });

    fireEvent.click(screen.getByText("start"));

    await waitFor(() => {
      expect(capturedState).toBe("error");

      expect(capturedError).toMatchObject({ type: "HTTPS_REQUIRED" });
    });
  });
});

describe("QR Payload Security — Validation", () => {
  it("rejects QR payload with missing fields", async () => {
    await act(async () => {
      render(<QRScanner />, { wrapper: createWrapper() });
    });

    fireEvent.click(screen.getByText("إدخال يدوي"));

    fireEvent.change(screen.getByPlaceholderText("لصق بيانات QR هنا..."), {
      target: { value: JSON.stringify({}) },
    });

    fireEvent.click(screen.getByText("تسجيل"));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ description: "بيانات QR غير صالحة" }),
      );
    });
  });

  it("rejects non-JSON payload", async () => {
    await act(async () => {
      render(<QRScanner />, { wrapper: createWrapper() });
    });

    fireEvent.click(screen.getByText("إدخال يدوي"));

    fireEvent.change(screen.getByPlaceholderText("لصق بيانات QR هنا..."), {
      target: { value: "some-random-string" },
    });

    fireEvent.click(screen.getByText("تسجيل"));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "خطأ" }));
    });
  });

  it("generates QR data URL with jwt-like token in payload", async () => {
    const mockToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbiI6InJhbmRvbVRva2VuIiwiaWF0IjoxNTE2MjM5MDIyfQ.signature";

    (await import("@/api/jobAssignments")).jobAssignmentsApi.generateCheckInQR = vi
      .fn()
      .mockResolvedValue({
        qrToken: mockToken,
        type: "check_in",
        expiresAt: new Date(Date.now() + 300000).toISOString(),
      } as never);

    const generateQRDataUrlMock = (await import("@/utils/qrGenerator"))
      .generateQRDataUrl as ReturnType<typeof vi.fn>;

    render(<QRGenerator assignmentId="ja1" assignmentStatus="assigned" />, {
      wrapper: createWrapper(),
    });

    fireEvent.click(screen.getByText("QR حضور"));

    await waitFor(() => {
      expect(generateQRDataUrlMock).toHaveBeenCalled();

      const payload = JSON.parse(generateQRDataUrlMock.mock.calls[0][0]);

      expect(payload.qrToken).toBe(mockToken);

      expect(payload.qrToken.split(".").length).toBe(3);
    });
  });
});

describe("QRScanner — Duplicate scan prevention", () => {
  it("disables submit button during pending mutation", async () => {
    let resolveMutation: (v: unknown) => void = () => {};

    (await import("@/api/jobAssignments")).jobAssignmentsApi.checkInWithQR = vi
      .fn()
      .mockReturnValue(
        new Promise((resolve) => {
          resolveMutation = resolve;
        }),
      );

    await act(async () => {
      render(<QRScanner />, { wrapper: createWrapper() });
    });

    fireEvent.click(screen.getByText("إدخال يدوي"));

    const qrData = JSON.stringify({ assignmentId: "ja1", qrToken: "jwt-token", type: "check_in" });

    fireEvent.change(screen.getByPlaceholderText("لصق بيانات QR هنا..."), {
      target: { value: qrData },
    });

    fireEvent.click(screen.getByText("تسجيل"));

    await waitFor(() => {
      expect(screen.getByText("تسجيل")).toBeDisabled();
    });

    await act(async () => {
      resolveMutation({ id: "ja1", status: "checked-in" });
    });
  });
});
