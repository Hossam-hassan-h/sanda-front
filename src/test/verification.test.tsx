import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import VerificationUpload from "@/components/VerificationUpload";
import Verification from "@/pages/settings/Verification";
import { toast } from "@/hooks/use-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import type { User } from "@/api/types";

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
  useToast: vi.fn(() => ({
    toast: vi.fn(),
    toasts: [],
    dismiss: vi.fn(),
  })),
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

import { useAuth } from "@/context/AuthContext";
const mockedUseAuth = useAuth as ReturnType<typeof vi.fn>;

function createQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={createQC()}>{children}</QueryClientProvider>;
}

const verifiedUser: User = {
  id: "u2",
  name: "سارة عبدالله",
  phone: "01000000002",
  role: "employer",
  walletBalance: 5400,
  isVerified: true,
  rating: 4.9,
  ratingsCount: 18,
  city: "الجيزة",
  avatar: "https://i.pravatar.cc/150?img=47",
  createdAt: "2025-08-04",
  updatedAt: "2025-08-04",
  isActive: true,
};

const unverifiedUser: User = {
  id: "u3",
  name: "محمود حسن",
  phone: "01000000003",
  role: "worker",
  walletBalance: 320,
  isVerified: false,
  rating: 4.3,
  ratingsCount: 9,
  city: "الإسكندرية",
  avatar: "https://i.pravatar.cc/150?img=33",
  createdAt: "2026-01-10",
  updatedAt: "2026-01-10",
  isActive: true,
};

function mockAuth(user: User | null) {
  mockedUseAuth.mockReturnValue({
    user,
    isLoading: false,
    isAuthenticated: !!user,
    login: vi.fn().mockResolvedValue(user),
    register: vi.fn().mockResolvedValue(user),
    logout: vi.fn(),
    switchRole: vi.fn(),
  });
}

describe("VerificationUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the upload form with all three sections", () => {
    render(<VerificationUpload />, { wrapper: Wrapper });

    expect(screen.getByText("رفع مستندات التوثيق والأمان")).toBeInTheDocument();
    expect(screen.getByText("صورة بطاقة الرقم القومي (من الأمام)")).toBeInTheDocument();
    expect(screen.getByText("صورة بطاقة الرقم القومي (من الخلف)")).toBeInTheDocument();
    expect(screen.getByText(/صورة شخصية واضحة/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "إرسال المستندات للمراجعة" })).toBeInTheDocument();
  });

  it("shows default placeholder text in all upload zones", () => {
    render(<VerificationUpload />, { wrapper: Wrapper });

    expect(screen.getByText("اضغط لرفع الصورة (أمام)")).toBeInTheDocument();
    expect(screen.getByText("اضغط لرفع الصورة (خلف)")).toBeInTheDocument();
    expect(screen.getByText("اضغط لرفع الصورة الشخصية")).toBeInTheDocument();
  });

  it("shows file names after selecting files", () => {
    render(<VerificationUpload />, { wrapper: Wrapper });

    const inputs = document.querySelectorAll<HTMLInputElement>("input[type='file']");
    const frontFile = new File(["front"], "national-front.png", { type: "image/png" });

    fireEvent.change(inputs[0], { target: { files: [frontFile] } });

    expect(screen.getByText("national-front.png")).toBeInTheDocument();
  });

  it("shows error toast when submitting without required files", () => {
    render(<VerificationUpload />, { wrapper: Wrapper });

    fireEvent.click(screen.getByRole("button", { name: "إرسال المستندات للمراجعة" }));

    expect(toast).toHaveBeenCalledWith({
      title: "الملفات ناقصة",
      description: "يرجى رفع صور بطاقة الرقم القومي (أمام وخلف).",
      variant: "destructive",
    });
  });

  it("submits successfully and shows pending state after 2s", () => {
    render(<VerificationUpload onSuccess={vi.fn()} />, { wrapper: Wrapper });

    const inputs = document.querySelectorAll<HTMLInputElement>("input[type='file']");
    fireEvent.change(inputs[0], { target: { files: [new File(["f"], "front.png", { type: "image/png" })] } });
    fireEvent.change(inputs[1], { target: { files: [new File(["b"], "back.png", { type: "image/png" })] } });

    fireEvent.click(screen.getByRole("button", { name: "إرسال المستندات للمراجعة" }));

    expect(screen.getByText("جاري رفع الملفات وتشفيرها...")).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(2000); });

    expect(screen.getByText("المستندات قيد المراجعة")).toBeInTheDocument();
    expect(screen.getByText("تم استلام مستندات التوثيق بنجاح وجاري تدقيقها حالياً.")).toBeInTheDocument();
  });
});

describe("Verification Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows verified state when user.isVerified is true", () => {
    mockAuth(verifiedUser);

    render(
      <MemoryRouter>
        <Wrapper>
          <Verification />
        </Wrapper>
      </MemoryRouter>
    );

    expect(screen.getByText("حسابك موثّق")).toBeInTheDocument();
    expect(screen.getByText("كل حاجة تمام")).toBeInTheDocument();
    expect(screen.getByText("موثّق")).toBeInTheDocument();
    expect(screen.queryByText("رفع مستندات التوثيق والأمان")).not.toBeInTheDocument();
  });

  it("shows upload form when user.isVerified is false", () => {
    mockAuth(unverifiedUser);

    render(
      <MemoryRouter>
        <Wrapper>
          <Verification />
        </Wrapper>
      </MemoryRouter>
    );

    expect(screen.getByText("حسابك غير موثّق")).toBeInTheDocument();
    expect(screen.getByText("رفع مستندات التوثيق والأمان")).toBeInTheDocument();
    expect(screen.queryByText("كل حاجة تمام")).not.toBeInTheDocument();
  });

  it("shows skeleton when user is null", () => {
    mockAuth(null);

    const { container } = render(
      <MemoryRouter>
        <Wrapper>
          <Verification />
        </Wrapper>
      </MemoryRouter>
    );

    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("shows requirements list with correct labels", () => {
    mockAuth(unverifiedUser);

    render(
      <MemoryRouter>
        <Wrapper>
          <Verification />
        </Wrapper>
      </MemoryRouter>
    );

    expect(screen.getByText("بطاقة الرقم القومي")).toBeInTheDocument();
    expect(screen.getAllByText("صورة شخصية واضحة").length).toBeGreaterThanOrEqual(1);
  });
});
