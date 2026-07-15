import { Navigate, Outlet } from "react-router-dom";
import { useAuth, type Role } from "./auth";

export default function RequireRole({ role }: { role: Role }) {
  const { session } = useAuth();

  if (!session || session.role !== role) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
