import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { ForbiddenPage } from "@/pages/ForbiddenPage";

/**
 * Route guard for management screens: guests are sent to sign in (and back afterwards), signed-in
 * non-admins see a 403. This is a convenience; the API enforces the same rule.
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  // Not signed in: go to the login page, remembering this page in ?next= so we can return after signing in.
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  // Signed in but not an administrator.
  if (!isAdmin) return <ForbiddenPage />;
  return children;
}
