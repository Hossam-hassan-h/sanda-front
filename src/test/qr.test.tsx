import { describe, it, expect, vi, beforeEach } from "vitest";
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

    render(<QRGenerator assignmentId="ja2" assignmentStatus="assigned" workerName="أحمد" />, {
      wrapper: createWrapper(),
    });

    fireEvent.click(screen.getByRole("button", { name: /QR حضور/ }));

    await waitFor(() => {
      expect(generateSpy).toHaveBeenCalledWith("ja2");
    });

    const qrImage = await screen.findByAltText("QR Code");
    expect(qrImage).toBeInTheDocument();
    expect(qrImage.getAttribute("src")).toContain("api.qrserver.com");
    expect(qrImage.getAttribute("src")).toContain("mock-token");
    expect(screen.getByText(/أحمد/)).toBeInTheDocument();
    expect(toast).not.toHaveBeenCalled();
  });
});

describe("QRScanner Component", () => {
  it("should render camera start button and manual entry section", () => {
    render(<QRScanner />, { wrapper: createWrapper() });

    expect(screen.getByText("فتح الكاميرا")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("لصق بيانات QR هنا...")).toBeInTheDocument();
  });

  it("should trigger camera access when open camera is clicked", async () => {
    render(<QRScanner />, { wrapper: createWrapper() });

    fireEvent.click(screen.getByRole("button", { name: "فتح الكاميرا" }));

    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        video: { facingMode: "environment" },
      });
    });

    expect(screen.getByText("إيقاف")).toBeInTheDocument();
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

    render(<QRScanner />, { wrapper: createWrapper() });

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
      expect(checkInSpy).toHaveBeenCalledWith("ja2", "mock-token");
    });

    expect(toast).toHaveBeenCalledWith({
      title: "تم تسجيل الحضور",
      description: "تم تسجيل دخولك بنجاح",
    });
  });

  it("should show error toast if check-in mutation fails", async () => {
    const checkInSpy = vi
      .spyOn(jobAssignmentsApi, "checkInWithQR")
      .mockRejectedValue(new Error("API Error"));

    render(<QRScanner />, { wrapper: createWrapper() });

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
      expect(checkInSpy).toHaveBeenCalled();
    });

    expect(toast).toHaveBeenCalledWith({
      title: "خطأ",
      description: "API Error",
      variant: "destructive",
    });
  });
});
