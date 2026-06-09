import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/api/types";

export default function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: UserRole[] }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/jobs" replace />;
  }
  return <>{children}</>;
}
