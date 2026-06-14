import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/api/types";

export function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: UserRole[] }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (roles && user && !roles.includes(user.role)) {
    if (user.role === "admin") return <Navigate to="/admin" replace />;
    return <Navigate to="/jobs" replace />;
  }
  return <>{children}</>;
}

/** Blocks admin users from accessing user-facing routes. Public for everyone else. */
export function NonAdminRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (user?.role === "admin") return <Navigate to="/admin" replace />;
  return <>{children}</>;
}

export default ProtectedRoute;
