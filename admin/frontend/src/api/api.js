// Đây chỉ là wrapper cơ bản để gọi backend khi có.
import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:4001/api",
  timeout: 8000,
});

// Add request interceptor to include token
API.interceptors.request.use((config) => {
  const userRaw = localStorage.getItem("admin_user");
  if (userRaw) {
    try {
      const user = JSON.parse(userRaw);
      if (user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    } catch (e) {
      console.error("Error parsing user from local storage", e);
    }
  }
  return config;
});

// wrapper có try/catch
export async function get(path, fallback = null) {
  try {
    const r = await API.get(path);
    return r.data;
  } catch (e) {
    console.warn("API GET error:", e && e.message);
    return fallback;
  }
}

export async function post(path, body) {
  try {
    const r = await API.post(path, body);
    return r.data;
  } catch (e) {
    console.warn("API POST error:", e && e.message);
    throw e;
  }
}

export async function put(path, body) {
  try {
    const r = await API.put(path, body);
    return r.data;
  } catch (e) {
    console.warn("API PUT error:", e && e.message);
    throw e;
  }
}

export async function patch(path, body) {
  try {
    const r = await API.patch(path, body);
    return r.data;
  } catch (e) {
    console.warn("API PATCH error:", e && e.message);
    throw e;
  }
}

export async function del(path) {
  try {
    const r = await API.delete(path);
    return r.data;
  } catch (e) {
    console.warn("API DELETE error:", e && e.message);
    throw e;
  }
}
