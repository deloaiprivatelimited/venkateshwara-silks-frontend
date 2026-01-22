import axios from "axios";
import { jwtDecode } from "jwt-decode";

export const isTokenExpired = (token: string) => {
  try {
    const decoded: any = jwtDecode(token);
    if (!decoded.exp) return true;

    const now = Date.now() / 1000;
    return decoded.exp < now;
  } catch {
    return true;
  }
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: false,
});

// ✅ Request interceptor (attach token only if valid)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    if (isTokenExpired(token)) {
      localStorage.removeItem("token");
      // do not attach expired token
      return config;
    }

    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ✅ Response interceptor (if token expired → force logout)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem("token");

      // ✅ Redirect to login
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;
