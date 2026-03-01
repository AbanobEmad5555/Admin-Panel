import axios from "axios";
import { ADMIN_TOKEN_KEY, clearAdminToken } from "@/lib/auth";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
});

api.interceptors.request.use((config) => {
  if (typeof window === "undefined") {
    return config;
  }

  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (token) {
    if (!config.headers) {
      config.headers = {};
    }
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401 && typeof window !== "undefined") {
      clearAdminToken();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
