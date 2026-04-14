// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

function getFrontendBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_FRONTEND_BASE_URL;
  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:3000`;
  }

  return "http://localhost:3000";
}

function readIncomingAdminSession() {
  if (typeof window === "undefined") return null;

  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  const hashParams = new URLSearchParams(hash);
  const encodedSession = hashParams.get("admin-auth");

  if (!encodedSession) return null;

  try {
    const parsedSession = JSON.parse(decodeURIComponent(atob(encodedSession)));
    if (!parsedSession?.token || parsedSession.role !== "admin") {
      return null;
    }

    return parsedSession;
  } catch (error) {
    console.error("Không thể đọc phiên admin được chuyển từ trang chủ", error);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isReady, setIsReady] = useState(false);

  // Load lại user khi reload trang
  useEffect(() => {
    const incomingSession = readIncomingAdminSession();

    if (incomingSession) {
      localStorage.setItem("admin_user", JSON.stringify(incomingSession));
      setCurrentUser(incomingSession);
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
      setIsReady(true);
      return;
    }

    const raw = localStorage.getItem("admin_user");
    if (!raw) {
      setCurrentUser(null);
      setIsReady(true);
      return;
    }

    try {
      setCurrentUser(JSON.parse(raw));
    } catch {
      localStorage.removeItem("admin_user");
      setCurrentUser(null);
    }

    setIsReady(true);
  }, []);

  // LOGIN – chỉ 1 tài khoản admin

  async function login(username, password) {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { ok: false, message: data.message || "Đăng nhập thất bại" };
      }

      // Lưu user + token
      const userData = { ...data.user, token: data.token };
      localStorage.setItem("admin_user", JSON.stringify(userData));
      setCurrentUser(userData);
      return { ok: true };

    } catch (err) {
      console.error("Login error", err);
      return { ok: false, message: "Lỗi kết nối server" };
    }
  }

  // LOGOUT
  function logout() {
    localStorage.removeItem("admin_user");
    setCurrentUser(null);
    window.location.assign(`${getFrontendBaseUrl()}/?adminLogout=1`);
  }

  return (
    <AuthContext.Provider value={{ currentUser, isReady, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
