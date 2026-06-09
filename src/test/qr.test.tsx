import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import QRGenerator from "@/components/QRGenerator";
import QRScanner from "@/components/QRScanner";
import { jobAssignmentsApi } from "@/api/jobAssignments";
import { toast } from "@/hooks/use-toast";

// Mock the toast hook
vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
  useToast: vi.fn(() => ({
    toast: vi.fn(),
    toasts: [],
    dismiss: vi.fn(),
  })),
}));

// Mock browser dependencies for QR scanner in jsdom
beforeEach(() => {
  vi.clearAllMocks();

  // Mock HTMLVideoElement.prototype.play and srcObject
  if (typeof window !== "undefined") {
    HTMLVideoElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(HTMLVideoElement.prototype, "srcObject", {
      set: vi.fn(),
      get: vi.fn(),
      configurable: true,
    });
  }

  // Mock navigator.mediaDevices.getUserMedia
  if (typeof navigator !== "undefined") {
    Object.defineProperty(navigator, "mediaDevices", {
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [
            {
              stop: vi.fn(),
            },
          ],
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
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("QRGenerator Component", () => {
  it("should display a warning if the job status is not 'in-progress'", () => {
    render(
      <QRGenerator jobId="j1" jobTitle="نادل لحفل زفاف" jobStatus="open" />,
      { wrapper: createWrapper() }
    );

    expect(
      screen.getByText("QR Code متاح فقط للوظائف النشطة (in-progress)")
    ).toBeInTheDocument();
  });

  it("should render generate button when job is in-progress and no QR code is generated yet", () => {
    render(
      <QRGenerator jobId="j4" jobTitle="مساعد مطبخ" jobStatus="in-progress" />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText("توليد QR Code")).toBeInTheDocument();
    expect(
      screen.getByText("اضغط لتوليد QR Code فريد للعامل لتسجيل حضوره")
    ).toBeInTheDocument();
  });

  it("should generate and display QR code when generate button is clicked", async () => {
    const generateSpy = vi
      .spyOn(jobAssignmentsApi, "generateQR")
      .mockResolvedValue({
        qrCode: "https://example.com/mock-qr.png",
        qrData: JSON.stringify({
          jobId: "j4",
          timestamp: 123456789,
          secret: "sanda-secret",
        }),
      });

    render(
      <QRGenerator jobId="j4" jobTitle="مساعد مطبخ" jobStatus="in-progress" />,
      { wrapper: createWrapper() }
    );

    const button = screen.getByRole("button", { name: "توليد QR Code" });
    fireEvent.click(button);

    await waitFor(() => {
      expect(generateSpy).toHaveBeenCalledWith("j4");
    });

    // Verify QR code image is displayed
    const qrImage = await screen.findByAltText("QR Code");
    expect(qrImage).toBeInTheDocument();
    expect(qrImage).toHaveAttribute("src", "https://example.com/mock-qr.png");

    // Verify job title is shown
    expect(screen.getByText("مساعد مطبخ")).toBeInTheDocument();

    // Verify toast was called
    expect(toast).toHaveBeenCalledWith({
      title: "تم توليد QR Code",
      description: "صالح لمدة 24 ساعة",
    });
  });
});

describe("QRScanner Component", () => {
  it("should render camera start button and manual entry section", () => {
    render(<QRScanner jobId="j4" />, { wrapper: createWrapper() });

    expect(screen.getByText("فتح الكاميرا")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("لصق بيانات QR هنا...")).toBeInTheDocument();
  });

  it("should trigger camera access when open camera is clicked", async () => {
    render(<QRScanner jobId="j4" />, { wrapper: createWrapper() });

    const openCamButton = screen.getByRole("button", { name: "فتح الكاميرا" });
    fireEvent.click(openCamButton);

    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        video: { facingMode: "environment" },
      });
    });

    expect(screen.getByText("إيقاف")).toBeInTheDocument();
  });

  it("should successfully check in when manual inputs are submitted with valid QR data", async () => {
    const checkInSpy = vi
      .spyOn(jobAssignmentsApi, "checkIn")
      .mockResolvedValue({
        id: "ja-new",
        jobId: "j4",
        job: { id: "j4", title: "مساعد مطبخ", city: "القاهرة", price: 250 },
        workerId: "u1",
        worker: { id: "u1", name: "أحمد المصري", rating: 4.8 },
        checkInTime: new Date().toISOString(),
        status: "checked-in",
        createdAt: new Date().toISOString(),
      });

    render(<QRScanner jobId="j4" />, { wrapper: createWrapper() });

    const input = screen.getByPlaceholderText("لصق بيانات QR هنا...");
    const qrData = JSON.stringify({
      jobId: "j4",
      timestamp: Date.now(),
      secret: "sanda-secret",
    });

    fireEvent.change(input, { target: { value: qrData } });
    const submitBtn = screen.getByRole("button", { name: "تسجيل" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(checkInSpy).toHaveBeenCalledWith("j4", qrData);
    });

    // Verify success toast was called
    expect(toast).toHaveBeenCalledWith({
      title: "تم تسجيل الحضور",
      description: "تم تسجيل دخولك بنجاح",
    });
  });

  it("should show error toast if checkIn mutation fails", async () => {
    const checkInSpy = vi
      .spyOn(jobAssignmentsApi, "checkIn")
      .mockRejectedValue(new Error("API Error"));

    render(<QRScanner jobId="j4" />, { wrapper: createWrapper() });

    const input = screen.getByPlaceholderText("لصق بيانات QR هنا...");
    const qrData = JSON.stringify({
      jobId: "j4",
      timestamp: Date.now(),
      secret: "sanda-secret",
    });

    fireEvent.change(input, { target: { value: qrData } });
    const submitBtn = screen.getByRole("button", { name: "تسجيل" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(checkInSpy).toHaveBeenCalled();
    });

    // Verify failure toast was called
    expect(toast).toHaveBeenCalledWith({
      title: "خطأ",
      description: "فشل في تسجيل الحضور",
      variant: "destructive",
    });
  });
});
