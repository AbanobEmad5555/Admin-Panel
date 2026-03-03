import { getAdminToken } from "@/lib/auth";

const parseJwtPayload = (token: string): Record<string, unknown> | null => {
  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
};

export const getCurrentAdminRole = (): string | null => {
  const token = getAdminToken();
  if (!token) {
    return null;
  }

  const payload = parseJwtPayload(token);
  const nestedData = (payload?.data ?? null) as Record<string, unknown> | null;
  const role = payload?.role ?? payload?.userRole ?? nestedData?.role;
  if (typeof role !== "string") {
    return null;
  }
  return role.toUpperCase();
};
