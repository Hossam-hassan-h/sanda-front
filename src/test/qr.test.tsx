import type React from "react";
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
  it("renders a QR generation action before check-in", () => {
    render(<QRGenerator assignmentId="ja1" assignmentStatus="assigned" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByRole("button", { name: /QR/ })).toBeInTheDocument();
  });

  it("renders a QR generation action after check-in", () => {
    render(<QRGenerator assignmentId="ja1" assignmentStatus="checked-in" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByRole("button", { name: /QR/ })).toBeInTheDocument();
  });

  it("generates and displays a check-in QR code", async () => {
    const generateSpy = vi
      .spyOn(jobAssignmentsApi, "generateCheckInQR")
      .mockResolvedValue({
        qrToken: "mock-token",
        type: "check_in",
        expiresAt: new Date(Date.now() + 300000).toISOString(),
      });

    render(<QRGenerator assignmentId="ja1" assignmentStatus="assigned" />, {
      wrapper: createWrapper(),
    });

    fireEvent.click(screen.getByRole("button", { name: /QR/ }));

    await waitFor(() => {
      expect(generateSpy).toHaveBeenCalledWith("ja1");
    });

    const qrImage = await screen.findByAltText("QR Code");
    expect(qrImage).toBeInTheDocument();
    expect(qrImage).toHaveAttribute("src", expect.stringContaining("api.qrserver.com"));
    expect(qrImage).toHaveAttribute("src", expect.stringContaining("mock-token"));
    expect(toast).not.toHaveBeenCalled();
  });
});

describe("QRScanner Component", () => {
  it("renders camera start button and manual entry field", () => {
    render(<QRScanner />, { wrapper: createWrapper() });

    expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("triggers camera access when the camera button is clicked", async () => {
    render(<QRScanner />, { wrapper: createWrapper() });

    fireEvent.click(screen.getAllByRole("button")[0]);

    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        video: { facingMode: "environment" },
      });
    });
  });

  it("checks in when manual QR data is submitted", async () => {
    const checkInSpy = vi
      .spyOn(jobAssignmentsApi, "checkInWithQR")
      .mockResolvedValue({
        id: "ja-new",
        jobId: "j4",
        job: { id: "j4", title: "Kitchen Assistant", city: "Cairo", price: 250 },
        workerId: "u1",
        worker: { id: "u1", name: "Test Worker", rating: 4.8 },
        checkInTime: new Date().toISOString(),
        status: "checked-in",
        createdAt: new Date().toISOString(),
      });

    render(<QRScanner />, { wrapper: createWrapper() });

    const qrData = JSON.stringify({
      assignmentId: "ja-new",
      qrToken: "mock-token",
      type: "check_in",
    });

    fireEvent.change(screen.getByRole("textbox"), { target: { value: qrData } });
    fireEvent.click(screen.getAllByRole("button")[1]);

    await waitFor(() => {
      expect(checkInSpy).toHaveBeenCalledWith("ja-new", "mock-token");
    });

    expect(toast).toHaveBeenCalledWith({
      title: "تم تسجيل الحضور",
      description: "تم تسجيل دخولك بنجاح",
    });
  });

  it("shows an error toast if QR check-in fails", async () => {
    const checkInSpy = vi
      .spyOn(jobAssignmentsApi, "checkInWithQR")
      .mockRejectedValue(new Error("API Error"));

    render(<QRScanner />, { wrapper: createWrapper() });

    const qrData = JSON.stringify({
      assignmentId: "ja-new",
      qrToken: "mock-token",
      type: "check_in",
    });

    fireEvent.change(screen.getByRole("textbox"), { target: { value: qrData } });
    fireEvent.click(screen.getAllByRole("button")[1]);

    await waitFor(() => {
      expect(checkInSpy).toHaveBeenCalledWith("ja-new", "mock-token");
    });

    expect(toast).toHaveBeenCalledWith({
      title: "خطأ",
      description: "API Error",
      variant: "destructive",
    });
  });
});
