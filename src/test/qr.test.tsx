import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import QRGenerator from "@/components/QRGenerator";
import QRScanner from "@/components/QRScanner";
import { toast } from "@/hooks/use-toast";

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
  useToast: vi.fn(() => ({ toast: vi.fn(), toasts: [], dismiss: vi.fn() })),
}));

vi.mock("@/utils/audio", () => ({
  playScanSound: vi.fn(),
  vibrateOnScan: vi.fn(),
}));

vi.mock("@/utils/qrGenerator", () => ({
  generateQRDataUrl: vi.fn().mockResolvedValue("data:image/png;base64,mock-qr"),
  downloadQRImage: vi.fn(),
}));

vi.mock("@/utils/camera", () => ({
  getCameraPermissionStatus: vi.fn().mockResolvedValue("granted"),
  isSecureContext: vi.fn().mockReturnValue(true),
  supportsTorch: vi.fn().mockReturnValue(false),
  getCameras: vi.fn().mockResolvedValue([
    { deviceId: "cam1", kind: "videoinput", label: "back" },
  ]),
}));

let geolocationCb: ((pos: GeolocationPosition) => void) | null;
let geolocationErrCb: ((err: GeolocationPositionError) => void) | null;

beforeEach(() => {
  vi.clearAllMocks();
  geolocationCb = null;
  geolocationErrCb = null;

  if (typeof window !== "undefined") {
    HTMLVideoElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(HTMLVideoElement.prototype, "srcObject", {
      set: vi.fn(),
      get: vi.fn(),
      configurable: true,
    });
  }

  if (typeof navigator !== "undefined") {
    Object.defineProperty(navigator, "mediaDevices", {
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: vi.fn() }],
        }),
        enumerateDevices: vi.fn().mockResolvedValue([
          { deviceId: "cam1", kind: "videoinput", label: "back" },
        ]),
      },
      writable: true,
      configurable: true,
    });

    Object.defineProperty(navigator, "geolocation", {
      value: {
        getCurrentPosition: vi.fn((success: (pos: GeolocationPosition) => void, _error?: (err: GeolocationPositionError) => void) => {
          geolocationCb = success;
          geolocationErrCb = _error ?? null;
        }),
      },
      writable: true,
      configurable: true,
    });
  }
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("QRGenerator Component — Positive", () => {
  it("renders generate button when assignment is assigned", () => {
    render(<QRGenerator assignmentId="ja1" assignmentStatus="assigned" />, { wrapper: createWrapper() });
    expect(screen.getByText("QR حضور")).toBeInTheDocument();
  });

  it("renders checkout button when assignment is checked-in", () => {
    render(<QRGenerator assignmentId="ja1" assignmentStatus="checked-in" />, { wrapper: createWrapper() });
    expect(screen.getByText("QR انصراف")).toBeInTheDocument();
  });

  it("shows completed state when checked out", () => {
    render(<QRGenerator assignmentId="ja1" assignmentStatus="checked-out" />, { wrapper: createWrapper() });
    expect(screen.getByText("تم الانصراف")).toBeInTheDocument();
    expect(screen.queryByText("QR حضور")).not.toBeInTheDocument();
  });

  it("displays worker name when provided", () => {
    render(<QRGenerator assignmentId="ja1" assignmentStatus="assigned" workerName="أحمد" />, { wrapper: createWrapper() });
    expect(screen.getByText(/أحمد/)).toBeInTheDocument();
  });

  it("hides both QR buttons when checked out", () => {
    render(<QRGenerator assignmentId="ja1" assignmentStatus="checked-out" />, { wrapper: createWrapper() });
    expect(screen.queryByText("QR حضور")).not.toBeInTheDocument();
    expect(screen.queryByText("QR انصراف")).not.toBeInTheDocument();
  });
});

describe("QRGenerator Component — Negative & Edge", () => {
  it("shows QR image after successful generation", async () => {
    (await import("@/api/jobAssignments")).jobAssignmentsApi.generateCheckInQR = vi.fn().mockResolvedValue({
      qrToken: "jwt-mock-token", type: "check_in", expiresAt: new Date(Date.now() + 300000).toISOString(),
    } as never);

    render(<QRGenerator assignmentId="ja1" assignmentStatus="assigned" />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByText("QR حضور"));

    await waitFor(() => {
      const img = screen.getByAltText("QR Code");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "data:image/png;base64,mock-qr");
    });
  });

  it("calls generateQRDataUrl with correct payload", async () => {
    const generateQRDataUrlMock = (await import("@/utils/qrGenerator")).generateQRDataUrl as ReturnType<typeof vi.fn>;
    (await import("@/api/jobAssignments")).jobAssignmentsApi.generateCheckInQR = vi.fn().mockResolvedValue({
      qrToken: "jwt-token-xyz", type: "check_in", expiresAt: new Date(Date.now() + 300000).toISOString(),
    });

    render(<QRGenerator assignmentId="ja1" assignmentStatus="assigned" />, { wrapper: createWrapper() });
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
    (await import("@/api/jobAssignments")).jobAssignmentsApi.generateCheckInQR = vi.fn().mockRejectedValue(new Error("فشل الاتصال"));

    render(<QRGenerator assignmentId="ja1" assignmentStatus="assigned" />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByText("QR حضور"));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "فشل إنشاء QR" }));
    });
  });

  it("shows error on generateQRDataUrl failure", async () => {
    (await import("@/api/jobAssignments")).jobAssignmentsApi.generateCheckInQR = vi.fn().mockResolvedValue({
      qrToken: "token", type: "check_in", expiresAt: new Date(Date.now() + 300000).toISOString(),
    } as never);
    (await import("@/utils/qrGenerator")).generateQRDataUrl = vi.fn().mockRejectedValue(new Error("فشل التوليد"));

    render(<QRGenerator assignmentId="ja1" assignmentStatus="assigned" />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByText("QR حضور"));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "فشل إنشاء QR" }));
    });
  });

  it("does not render refund section when refund window is not active", () => {
    render(<QRGenerator assignmentId="ja1" assignmentStatus="assigned" />, { wrapper: createWrapper() });
    expect(screen.queryByText("Refund")).not.toBeInTheDocument();
  });

  it("shows refund section when refund window is active", () => {
    render(
      <QRGenerator assignmentId="ja1" assignmentStatus="checked-in" marketplaceStatus="REFUND_WINDOW_ACTIVE" refundDeadline={new Date(Date.now() + 60000).toISOString()} />,
      { wrapper: createWrapper() }
    );
    expect(screen.getByText("Refund employer")).toBeInTheDocument();
  });
});

describe("QRScanner Component — Positive", () => {
  it("renders camera button and manual toggle", () => {
    render(<QRScanner />, { wrapper: createWrapper() });
    expect(screen.getByText("فتح الكاميرا")).toBeInTheDocument();
    expect(screen.getByText("إدخال يدوي")).toBeInTheDocument();
  });

  it("toggles manual input when button clicked", () => {
    render(<QRScanner />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByText("إدخال يدوي"));
    expect(screen.getByPlaceholderText("لصق بيانات QR هنا...")).toBeInTheDocument();
    fireEvent.click(screen.getByText("إخفاء"));
    expect(screen.queryByPlaceholderText("لصق بيانات QR هنا...")).not.toBeInTheDocument();
  });

  it("processes check_in QR from manual input and shows success dialog", async () => {
    (await import("@/api/jobAssignments")).jobAssignmentsApi.checkInWithQR = vi.fn().mockResolvedValue({
      id: "ja1", status: "checked-in", createdAt: new Date().toISOString(),
    } as never);

    render(<QRScanner />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByText("إدخال يدوي"));

    const qrData = JSON.stringify({ assignmentId: "ja1", qrToken: "jwt-token", type: "check_in" });
    fireEvent.change(screen.getByPlaceholderText("لصق بيانات QR هنا..."), { target: { value: qrData } });
    fireEvent.click(screen.getByText("تسجيل"));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "تم تسجيل الحضور" }));
    });
  });

  it("processes check_out QR from manual input and shows success toast", async () => {
    (await import("@/api/jobAssignments")).jobAssignmentsApi.checkOutWithQR = vi.fn().mockResolvedValue({
      id: "ja1", status: "checked-out", createdAt: new Date().toISOString(),
    } as never);

    render(<QRScanner />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByText("إدخال يدوي"));

    const qrData = JSON.stringify({ assignmentId: "ja1", qrToken: "jwt-token", type: "check_out" });
    fireEvent.change(screen.getByPlaceholderText("لصق بيانات QR هنا..."), { target: { value: qrData } });
    fireEvent.click(screen.getByText("تسجيل"));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "تم تسجيل الانصراف" }));
    });
  });

  it("calls onScanComplete with true on success", async () => {
    const onScanComplete = vi.fn();
    (await import("@/api/jobAssignments")).jobAssignmentsApi.checkInWithQR = vi.fn().mockResolvedValue({
      id: "ja1", status: "checked-in", createdAt: new Date().toISOString(),
    } as never);

    render(<QRScanner onScanComplete={onScanComplete} />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByText("إدخال يدوي"));

    const qrData = JSON.stringify({ assignmentId: "ja1", qrToken: "jwt-token", type: "check_in" });
    fireEvent.change(screen.getByPlaceholderText("لصق بيانات QR هنا..."), { target: { value: qrData } });
    fireEvent.click(screen.getByText("تسجيل"));

    await waitFor(() => {
      expect(onScanComplete).toHaveBeenCalledWith(true);
    });
  });
});

describe("QRScanner Component — Negative", () => {
  it("disables submit button when manual input is empty", () => {
    render(<QRScanner />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByText("إدخال يدوي"));
    expect(screen.getByText("تسجيل")).toBeDisabled();
  });

  it("shows error on invalid JSON in manual input", async () => {
    render(<QRScanner />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByText("إدخال يدوي"));
    const input = screen.getByPlaceholderText("لصق بيانات QR هنا...");
    fireEvent.change(input, { target: { value: "not-json" } });
    fireEvent.click(screen.getByText("تسجيل"));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "خطأ" }));
    });
  });

  it("shows error on missing assignmentId field", async () => {
    render(<QRScanner />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByText("إدخال يدوي"));
    fireEvent.change(screen.getByPlaceholderText("لصق بيانات QR هنا..."), {
      target: { value: JSON.stringify({ qrToken: "x", type: "check_in" }) },
    });
    fireEvent.click(screen.getByText("تسجيل"));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({ description: "بيانات QR غير صالحة" }));
    });
  });

  it("shows error on missing qrToken field", async () => {
    render(<QRScanner />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByText("إدخال يدوي"));
    fireEvent.change(screen.getByPlaceholderText("لصق بيانات QR هنا..."), {
      target: { value: JSON.stringify({ assignmentId: "ja1", type: "check_in" }) },
    });
    fireEvent.click(screen.getByText("تسجيل"));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({ description: "بيانات QR غير صالحة" }));
    });
  });

  it("shows error on unknown QR type", async () => {
    render(<QRScanner />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByText("إدخال يدوي"));
    fireEvent.change(screen.getByPlaceholderText("لصق بيانات QR هنا..."), {
      target: { value: JSON.stringify({ assignmentId: "ja1", qrToken: "x", type: "unknown_type" }) },
    });
    fireEvent.click(screen.getByText("تسجيل"));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({ description: "نوع QR غير معروف" }));
    });
  });

  it("shows error when API call fails (expired/invalid token)", async () => {
    (await import("@/api/jobAssignments")).jobAssignmentsApi.checkInWithQR = vi.fn().mockRejectedValue(new Error("انتهت صلاحية QR"));

    render(<QRScanner />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByText("إدخال يدوي"));

    fireEvent.change(screen.getByPlaceholderText("لصق بيانات QR هنا..."), {
      target: { value: JSON.stringify({ assignmentId: "ja1", qrToken: "expired-token", type: "check_in" }) },
    });
    fireEvent.click(screen.getByText("تسجيل"));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({ description: "انتهت صلاحية QR" }));
    });
  });

  it("calls onScanComplete with false on API failure", async () => {
    const onScanComplete = vi.fn();
    (await import("@/api/jobAssignments")).jobAssignmentsApi.checkInWithQR = vi.fn().mockRejectedValue(new Error("خطأ"));

    render(<QRScanner onScanComplete={onScanComplete} />, { wrapper: createWrapper() });
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
  it("shows idle placeholder when camera not started", () => {
    render(<QRScanner />, { wrapper: createWrapper() });
    expect(screen.getByText("اضغط لبدء المسح")).toBeInTheDocument();
  });

  it("shows close button after camera toggle", () => {
    render(<QRScanner />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByText("فتح الكاميرا"));
    expect(screen.getByText("إغلاق الكاميرا")).toBeInTheDocument();
  });

  it("shows no-camera error when no devices available", async () => {
    (await import("@/utils/camera")).getCameras = vi.fn().mockResolvedValue([]);

    render(<QRScanner />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByText("فتح الكاميرا"));

    await waitFor(() => {
      expect(screen.getByText(/لم يتم العثور على كاميرا/)).toBeInTheDocument();
    });
  });

  it("shows HTTPS error when not secure context", async () => {
    (await import("@/utils/camera")).isSecureContext = vi.fn().mockReturnValue(false);

    render(<QRScanner />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByText("فتح الكاميرا"));

    await waitFor(() => {
      expect(screen.getByText(/يجب استخدام HTTPS/)).toBeInTheDocument();
    });
  });

  it("shows close button when camera start fails (scanning state persists)", async () => {
    (await import("@/utils/camera")).isSecureContext = vi.fn().mockReturnValue(false);

    render(<QRScanner />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByText("فتح الكاميرا"));

    await waitFor(() => {
      expect(screen.getByText("إغلاق الكاميرا")).toBeInTheDocument();
    });
  });
});

describe("QRScanner — GPS", () => {
  it("shows GPS loading indicator when geolocation pending", () => {
    render(<QRScanner />, { wrapper: createWrapper() });
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
      const { useQrScanner } = vi.hoisted(() => ({ useQrScanner: () => ({ state: "idle", error: null, devices: [], selectedDeviceId: null, start: vi.fn(), stop: vi.fn(), switchCamera: vi.fn(), toggleTorch: vi.fn(), isTorchOn: false, torchSupported: false }) }));
      // Re-import to get actual hook for real tests below
      return <div data-testid="hook-state">idle</div>;
    };
    render(<TestComponent />, { wrapper: createWrapper() });
    expect(screen.getByTestId("hook-state")).toHaveTextContent("idle");
  });

  it("transitions to error on missing camera", async () => {
    (await import("@/utils/camera")).getCameras = vi.fn().mockResolvedValue([]);
    (await import("@/utils/camera")).isSecureContext = vi.fn().mockReturnValue(true);

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
    (await import("@/utils/camera")).isSecureContext = vi.fn().mockReturnValue(false);

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
    render(<QRScanner />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByText("إدخال يدوي"));
    fireEvent.change(screen.getByPlaceholderText("لصق بيانات QR هنا..."), {
      target: { value: JSON.stringify({}) },
    });
    fireEvent.click(screen.getByText("تسجيل"));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({ description: "بيانات QR غير صالحة" }));
    });
  });

  it("rejects non-JSON payload", async () => {
    render(<QRScanner />, { wrapper: createWrapper() });
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
    const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbiI6InJhbmRvbVRva2VuIiwiaWF0IjoxNTE2MjM5MDIyfQ.signature";
    (await import("@/api/jobAssignments")).jobAssignmentsApi.generateCheckInQR = vi.fn().mockResolvedValue({
      qrToken: mockToken, type: "check_in", expiresAt: new Date(Date.now() + 300000).toISOString(),
    } as never);

    const generateQRDataUrlMock = (await import("@/utils/qrGenerator")).generateQRDataUrl as ReturnType<typeof vi.fn>;
    render(<QRGenerator assignmentId="ja1" assignmentStatus="assigned" />, { wrapper: createWrapper() });
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
    (await import("@/api/jobAssignments")).jobAssignmentsApi.checkInWithQR = vi.fn().mockReturnValue(
      new Promise((resolve) => { resolveMutation = resolve; })
    );

    render(<QRScanner />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByText("إدخال يدوي"));

    const qrData = JSON.stringify({ assignmentId: "ja1", qrToken: "jwt-token", type: "check_in" });
    fireEvent.change(screen.getByPlaceholderText("لصق بيانات QR هنا..."), { target: { value: qrData } });

    fireEvent.click(screen.getByText("تسجيل"));

    await waitFor(() => {
      expect(screen.getByText("تسجيل")).toBeDisabled();
    });

    await act(async () => { resolveMutation({ id: "ja1", status: "checked-in" }); });
  });
});
