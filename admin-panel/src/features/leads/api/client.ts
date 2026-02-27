import axios from "axios";
import { toast } from "sonner";
import { ADMIN_TOKEN_KEY } from "@/lib/auth";

const baseURL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000";

let shown401Toast = false;

export const leadsApiClient = axios.create({
  baseURL,
});

leadsApiClient.interceptors.request.use((config) => {
  if (typeof window === "undefined") {
    return config;
  }

  const token =
    localStorage.getItem(ADMIN_TOKEN_KEY) || localStorage.getItem("token");

  if (token) {
    if (!config.headers) {
      config.headers = {};
    }
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  return config;
});

leadsApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if (typeof window !== "undefined" && status === 401 && !shown401Toast) {
      shown401Toast = true;
      toast.error("Unauthorized. Please login again.");
      window.setTimeout(() => {
        shown401Toast = false;
      }, 1800);
    }

    return Promise.reject(error);
  }
);
