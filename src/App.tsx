import { lazy, Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import ProtectedRoute, { NonAdminRoute } from "@/components/ProtectedRoute";
import PageLoader from "@/components/PageLoader";
import ErrorBoundary from "@/components/ErrorBoundary";

// ─── Lazy-loaded pages ───────────────────────────────────────────────
// Each import becomes its own chunk → user only downloads what they visit.
const Landing       = lazy(() => import("./pages/Landing"));
const Login         = lazy(() => import("./pages/auth/Login"));
const Register      = lazy(() => import("./pages/auth/Register"));
const JobsFeed      = lazy(() => import("./pages/jobs/JobsFeed"));
const JobDetails    = lazy(() => import("./pages/jobs/JobDetails"));
const PostJob       = lazy(() => import("./pages/jobs/PostJob"));
const EditJob       = lazy(() => import("./pages/jobs/EditJob"));
const MyJobs        = lazy(() => import("./pages/jobs/MyJobs"));
const Applicants    = lazy(() => import("./pages/jobs/Applicants"));
const ActiveJob     = lazy(() => import("./pages/jobs/ActiveJob"));
const JobAssignments = lazy(() => import("./pages/jobs/JobAssignments"));
const WorkerJobs    = lazy(() => import("./pages/worker/WorkerJobs"));
const Wallet        = lazy(() => import("./pages/wallet/Wallet"));
const Chat          = lazy(() => import("./pages/chat/Chat"));
const Profile       = lazy(() => import("./pages/profile/Profile"));
const NotificationsPage = lazy(() => import("./pages/notifications/NotificationsPage"));
const Settings      = lazy(() => import("./pages/settings/Settings"));
const Verification  = lazy(() => import("./pages/settings/Verification"));
const Help          = lazy(() => import("./pages/help/Help"));
const About         = lazy(() => import("./pages/help/About"));
const Terms         = lazy(() => import("./pages/help/Terms"));
const Privacy       = lazy(() => import("./pages/help/Privacy"));

// Admin pages — also lazy, so non-admin users never download this code.
const AdminDashboard    = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers        = lazy(() => import("./pages/admin/AdminUsers"));
const AdminReports      = lazy(() => import("./pages/admin/AdminReports"));
const AdminReportDetail = lazy(() => import("./pages/admin/AdminReportDetail"));
const AdminJobs         = lazy(() => import("./pages/admin/AdminJobs"));
const AdminJobDetail    = lazy(() => import("./pages/admin/AdminJobDetail"));
const AdminWallet       = lazy(() => import("./pages/admin/AdminWallet"));
const AdminChatMonitor  = lazy(() => import("./pages/admin/AdminChatMonitor"));
const AdminUserLogs     = lazy(() => import("./pages/admin/AdminUserLogs"));
const AdminUserDetail   = lazy(() => import("./pages/admin/AdminUserDetail"));
const AdminSettings     = lazy(() => import("./pages/admin/AdminSettings"));

const NotFound = lazy(() => import("./pages/NotFound"));

// ─── React Query client ──────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
});

// ─── Helpers ─────────────────────────────────────────────────────────

/** Scrolls to top on every route change. */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}

/** Wraps the entire app with React Query, Auth, and UI providers. */
function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          {children}
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

/** Redirects authenticated users away from public-only pages (e.g. Landing). */
function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated) {
    if (user?.role === "admin") return <Navigate to="/admin" replace />;
    return <Navigate to="/jobs" replace />;
  }
  return <>{children}</>;
}

/** Shows AdminDashboard if admin, otherwise redirects to login. */
function AdminRedirect() {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated && user?.role === "admin") return <AdminDashboard />;
  return <Navigate to="/login" replace />;
}

// ─── App ─────────────────────────────────────────────────────────────

const App = () => (
  <AppProviders>
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <ErrorBoundary>
          <Routes>
          {/* ── Public ─────────────────────────────────────────── */}
          <Route path="/" element={<PublicOnlyRoute><Landing /></PublicOnlyRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/help" element={<Help />} />
          <Route path="/about" element={<About />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />

          {/* ── Jobs ───────────────────────────────────────────── */}
          <Route path="/jobs" element={<NonAdminRoute><JobsFeed /></NonAdminRoute>} />
          <Route path="/jobs/new" element={<ProtectedRoute roles={["employer"]}><PostJob /></ProtectedRoute>} />
          <Route path="/jobs/:id" element={<NonAdminRoute><JobDetails /></NonAdminRoute>} />
          <Route path="/jobs/:id/edit" element={<ProtectedRoute roles={["employer"]}><EditJob /></ProtectedRoute>} />
          <Route path="/jobs/:id/applicants" element={<ProtectedRoute roles={["employer"]}><Applicants /></ProtectedRoute>} />
          <Route path="/jobs/:id/active" element={<ProtectedRoute roles={["worker","employer"]}><ActiveJob /></ProtectedRoute>} />
          <Route path="/jobs/:id/assignments" element={<ProtectedRoute roles={["employer"]}><JobAssignments /></ProtectedRoute>} />
          <Route path="/my-jobs" element={<ProtectedRoute roles={["employer"]}><MyJobs /></ProtectedRoute>} />
          <Route path="/my-jobs-active" element={<ProtectedRoute roles={["worker"]}><WorkerJobs /></ProtectedRoute>} />

          {/* ── User workspace ─────────────────────────────────── */}
          <Route path="/wallet" element={<ProtectedRoute roles={["worker","employer"]}><Wallet /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute roles={["worker","employer"]}><Chat /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute roles={["worker","employer"]}><Profile /></ProtectedRoute>} />
          <Route path="/profile/:id" element={<NonAdminRoute><Profile /></NonAdminRoute>} />
          <Route path="/notifications" element={<ProtectedRoute roles={["worker","employer"]}><NotificationsPage /></ProtectedRoute>} />

          {/* ── Settings ── */}
          <Route path="/settings" element={<ProtectedRoute roles={["worker","employer"]}><Settings /></ProtectedRoute>} />
          <Route path="/settings/verification" element={<ProtectedRoute roles={["worker","employer"]}><Verification /></ProtectedRoute>} />

          {/* ── Admin ──────────────────────────────────────────── */}
          <Route path="/admin" element={<AdminRedirect />} />
          <Route path="/admin/settings" element={<ProtectedRoute roles={["admin"]}><AdminSettings /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute roles={["admin"]}><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/users/:id" element={<ProtectedRoute roles={["admin"]}><AdminUserDetail /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute roles={["admin"]}><AdminReports /></ProtectedRoute>} />
          <Route path="/admin/reports/:id" element={<ProtectedRoute roles={["admin"]}><AdminReportDetail /></ProtectedRoute>} />
          <Route path="/admin/jobs" element={<ProtectedRoute roles={["admin"]}><AdminJobs /></ProtectedRoute>} />
          <Route path="/admin/jobs/:id" element={<ProtectedRoute roles={["admin"]}><AdminJobDetail /></ProtectedRoute>} />
          <Route path="/admin/wallet" element={<ProtectedRoute roles={["admin"]}><AdminWallet /></ProtectedRoute>} />
          <Route path="/admin/chat-monitor" element={<ProtectedRoute roles={["admin"]}><AdminChatMonitor /></ProtectedRoute>} />
          <Route path="/admin/user-logs" element={<ProtectedRoute roles={["admin"]}><AdminUserLogs /></ProtectedRoute>} />

          {/* ── 404 ───────────────────────────────────────────── */}
          <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
      </Suspense>
    </BrowserRouter>
  </AppProviders>
);

export default App;
