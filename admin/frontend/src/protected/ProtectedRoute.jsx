// src/protected/ProtectedRoute.jsx
import { useAuth } from "../context/AuthContext";
import Login from "../pages/Login";

/*
  ProtectedRoute: nếu chưa login -> render Login
  Nếu đã login -> render children (AdminLayout)
*/
export default function ProtectedRoute({ children }) {
  const { currentUser, isReady } = useAuth();

  if (!isReady) return null;

  if (!currentUser) return <Login />;

  return children;
}
