import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/**
 * ProtectedRoute — UX-layer gate only. It decides what to RENDER, not what
 * the user can actually fetch; that boundary is enforced by RLS + the
 * SECURITY DEFINER functions in the database, which hold even if someone
 * bypasses this component entirely (devtools, direct API calls, a routing
 * bug). Treat this file as "good manners", not "the lock".
 *
 * Usage:
 *   <ProtectedRoute allowedRoles={['admin']}>
 *     <AdminLayout />
 *   </ProtectedRoute>
 */
export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, role, status, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-neutral-400">
        Carregando...
      </div>
    );
  }

  // Not logged in at all
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but signup not yet approved by an admin
  if (status === "pending") {
    return <Navigate to="/pending" replace />;
  }

  if (status === "rejected") {
    return <Navigate to="/rejected" replace />;
  }

  // Logged in + approved, but wrong role for this route
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/nao-autorizado" replace />;
  }

  return children;
}
