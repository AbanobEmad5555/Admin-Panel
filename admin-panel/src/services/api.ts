import axios, { AxiosHeaders } from "axios";
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
    const headers = AxiosHeaders.from(config.headers);
    headers.set("Authorization", `Bearer ${token}`);
    config.headers = headers;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl = String(error?.config?.url ?? "");
    const isLoginRequest = requestUrl.includes("/api/auth/login");
    const hasToken =
      typeof window !== "undefined" && Boolean(localStorage.getItem(ADMIN_TOKEN_KEY));

    if (status === 401 && hasToken && !isLoginRequest && typeof window !== "undefined") {
      clearAdminToken();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
