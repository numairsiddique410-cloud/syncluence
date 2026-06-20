import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRole }) {
  const { user } = useAuth();

  // React setState is async — if state not yet updated after Google login,
  // fall back to localStorage which is set synchronously before navigate()
  const currentUser =
    user ?? JSON.parse(localStorage.getItem("currentUser") || "null");

  if (!currentUser) return <Navigate to="/" replace />;

  if (allowedRole && currentUser.role !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}
