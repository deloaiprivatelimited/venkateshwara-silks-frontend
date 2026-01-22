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
<<<<<<< HEAD
  baseURL: import.meta.env.VITE_API_BASE_URL
=======
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: false,
>>>>>>> 0f1db2324aff076815552c8b98ef9b60b373df85
});

// ✅ Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token && isTokenExpired(token)) {
      localStorage.removeItem("token");
      window.location.href = "/admin/login";
      return Promise.reject(new Error("Token expired"));
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/admin/login";
    }
    return Promise.reject(error);
  }
);

export default api;
