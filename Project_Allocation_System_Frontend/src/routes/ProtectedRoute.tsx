import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../app/store";
import { type ReactNode } from "react";

interface Props {
  children: ReactNode;
  allowedRoles: number[]; // Backend roles: 1=Admin, 2=PM, 3=TL, 4=TM
}

const ROLE_DASHBOARD_MAP: Record<number, string> = {
  1: "/admin",
  2: "/pm/dashboard",
  3: "/tl/dashboard",
  4: "/tm/dashboard",
};

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  // Not authenticated - redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // User doesn't have required role - redirect to their appropriate dashboard
  if (!allowedRoles.includes(user.role)) {
    const redirectPath = ROLE_DASHBOARD_MAP[user.role] || "/login";
    return <Navigate to={redirectPath} replace />;
  }

  // User has correct role - render children
  return <>{children}</>;
}
