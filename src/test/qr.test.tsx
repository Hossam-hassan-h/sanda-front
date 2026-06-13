import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import QRGenerator from "@/components/QRGenerator";
import QRScanner from "@/components/QRScanner";
import { jobAssignmentsApi } from "@/api/jobAssignments";
import { toast } from "@/hooks/use-toast";

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
  useToast: vi.fn(() => ({
    toast: vi.fn(),
    toasts: [],
    dismiss: vi.fn(),
  })),
}));

beforeEach(() => {
  vi.clearAllMocks();

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
      },
      writable: true,
      configurable: true,
    });
  }
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
  it("shows checked-out state when assignment status is checked-out", () => {
    render(
      <QRGenerator assignmentId="a1" assignmentStatus="checked-out" workerName="أحمد" />,
      { wrapper: createWrapper() }
    );
    expect(screen.getByText("تم الانصراف")).toBeInTheDocument();
    expect(screen.getByText("أحمد")).toBeInTheDocument();
  });

  it("shows check-in QR button when not checked in yet", () => {
    render(
      <QRGenerator assignmentId="a1" assignmentStatus="assigned" />,
      { wrapper: createWrapper() }
    );
    expect(screen.getByRole("button", { name: /QR حضور/ })).toBeInTheDocument();
  });

  it("shows check-out QR button when checked in", () => {
    render(
      <QRGenerator assignmentId="a1" assignmentStatus="checked-in" />,
      { wrapper: createWrapper() }
    );
    expect(screen.getByRole("button", { name: /QR انصراف/ })).toBeInTheDocument();
  });

  it("shows worker name in header when provided", () => {
    render(
      <QRGenerator assignmentId="a1" workerName="أحمد المصري" />,
      { wrapper: createWrapper() }
    );
    expect(screen.getByText(/أحمد المصري/)).toBeInTheDocument();
  });

  it("generates check-in QR and displays image on click", async () => {
    const generateSpy = vi
      .spyOn(jobAssignmentsApi, "generateCheckInQR")
      .mockResolvedValue({ qrToken: "test-token", type: "check_in", expiresAt: new Date(Date.now() + 300000).toISOString() });

    render(
      <QRGenerator assignmentId="a1" assignmentStatus="assigned" />,
      { wrapper: createWrapper() }
    );

    const btn = screen.getByRole("button", { name: /QR حضور/ });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(generateSpy).toHaveBeenCalledWith("a1");
    });

    const qrImage = await screen.findByAltText("QR Code");
    expect(qrImage).toBeInTheDocument();
    expect(qrImage).toHaveAttribute("src", expect.stringContaining("qrserver.com"));
  });

  it("shows download and refresh actions after QR generation", async () => {
    vi.spyOn(jobAssignmentsApi, "generateCheckInQR")
      .mockResolvedValue({ qrToken: "test-token", type: "check_in", expiresAt: new Date(Date.now() + 300000).toISOString() });

    const { container } = render(
      <QRGenerator assignmentId="a1" assignmentStatus="assigned" />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByRole("button", { name: /QR حضور/ }));

    await waitFor(() => {
      expect(container.querySelector(".lucide-download")).toBeInTheDocument();
      expect(container.querySelector(".lucide-refresh-cw")).toBeInTheDocument();
    });
  });
});

describe("QRScanner Component", () => {
  it("renders camera button and manual input section", () => {
    render(<QRScanner />, { wrapper: createWrapper() });

    expect(screen.getByRole("button", { name: "فتح الكاميرا" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("لصق بيانات QR هنا...")).toBeInTheDocument();
  });

  it("starts camera when open camera button is clicked", async () => {
    render(<QRScanner />, { wrapper: createWrapper() });

    fireEvent.click(screen.getByRole("button", { name: "فتح الكاميرا" }));

    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        video: { facingMode: "environment" },
      });
    });

    expect(screen.getByText("إيقاف")).toBeInTheDocument();
  });

  it("calls checkInWithQR on valid manual QR input and shows success", async () => {
    const checkInSpy = vi
      .spyOn(jobAssignmentsApi, "checkInWithQR")
      .mockResolvedValue({
        id: "a1", jobId: "j4", workerId: "u1",
        status: "checked-in", createdAt: new Date().toISOString(),
      } as never);

    const onScanComplete = vi.fn();
    render(<QRScanner onScanComplete={onScanComplete} />, { wrapper: createWrapper() });

    const input = screen.getByPlaceholderText("لصق بيانات QR هنا...");
    const qrPayload = JSON.stringify({ assignmentId: "a1", qrToken: "test-token", type: "check_in" });

    fireEvent.change(input, { target: { value: qrPayload } });
    fireEvent.click(screen.getByRole("button", { name: "تسجيل" }));

    await waitFor(() => {
      expect(checkInSpy).toHaveBeenCalledWith("a1", "test-token");
    });

    expect(toast).toHaveBeenCalledWith({
      title: "تم تسجيل الحضور",
      description: "تم تسجيل دخولك بنجاح",
    });

    expect(onScanComplete).toHaveBeenCalledWith(true);
  });

  it("calls checkOutWithQR for check_out type and shows success", async () => {
    const checkOutSpy = vi
      .spyOn(jobAssignmentsApi, "checkOutWithQR")
      .mockResolvedValue({
        id: "a1", jobId: "j4", workerId: "u1",
        status: "checked-out", createdAt: new Date().toISOString(),
      } as never);

    const onScanComplete = vi.fn();
    render(<QRScanner onScanComplete={onScanComplete} />, { wrapper: createWrapper() });

    const input = screen.getByPlaceholderText("لصق بيانات QR هنا...");
    const qrPayload = JSON.stringify({ assignmentId: "a1", qrToken: "test-token", type: "check_out" });

    fireEvent.change(input, { target: { value: qrPayload } });
    fireEvent.click(screen.getByRole("button", { name: "تسجيل" }));

    await waitFor(() => {
      expect(checkOutSpy).toHaveBeenCalledWith("a1", "test-token");
    });

    expect(toast).toHaveBeenCalledWith({
      title: "تم تسجيل الانصراف",
      description: "تم تسجيل خروجك بنجاح",
    });

    expect(onScanComplete).toHaveBeenCalledWith(true);
  });

  it("shows error toast on failed check-in and calls onScanComplete(false)", async () => {
    vi.spyOn(jobAssignmentsApi, "checkInWithQR")
      .mockRejectedValue(new Error("API Error"));

    const onScanComplete = vi.fn();
    render(<QRScanner onScanComplete={onScanComplete} />, { wrapper: createWrapper() });

    const input = screen.getByPlaceholderText("لصق بيانات QR هنا...");
    const qrPayload = JSON.stringify({ assignmentId: "a1", qrToken: "bad-token", type: "check_in" });

    fireEvent.change(input, { target: { value: qrPayload } });
    fireEvent.click(screen.getByRole("button", { name: "تسجيل" }));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith({
        title: "خطأ",
        description: "API Error",
        variant: "destructive",
      });
    });

    expect(onScanComplete).toHaveBeenCalledWith(false);
  });

  it("disables submit button while pending", async () => {
    vi.spyOn(jobAssignmentsApi, "checkInWithQR")
      .mockImplementation(() => new Promise(() => {}));

    render(<QRScanner />, { wrapper: createWrapper() });

    const input = screen.getByPlaceholderText("لصق بيانات QR هنا...");
    const validQrData = JSON.stringify({ assignmentId: "a1", qrToken: "test-token", type: "check_in" });
    fireEvent.change(input, { target: { value: validQrData } });

    fireEvent.click(screen.getByRole("button", { name: "تسجيل" }));

    await waitFor(() => {
      const btn = screen.getByRole("button", { name: "تسجيل" });
      expect(btn).toBeDisabled();
    });
  });

  it("shows error toast for invalid QR data", async () => {
    render(<QRScanner />, { wrapper: createWrapper() });

    const input = screen.getByPlaceholderText("لصق بيانات QR هنا...");
    fireEvent.change(input, { target: { value: "invalid-json" } });
    fireEvent.click(screen.getByRole("button", { name: "تسجيل" }));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "خطأ",
          variant: "destructive",
        })
      );
    });
  });
});
