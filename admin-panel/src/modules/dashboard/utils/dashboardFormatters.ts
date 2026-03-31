import { formatEGP } from "@/lib/currency";
import type { AdminLanguage } from "@/modules/localization/types";

export const formatDashboardCurrency = (value: number | string | null | undefined) => formatEGP(value);

export const formatDashboardDateTime = (value: string, language: AdminLanguage) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString(language === "ar" ? "ar-EG" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export const formatDashboardStatus = (value: string) => value.replace(/_/g, " ");
