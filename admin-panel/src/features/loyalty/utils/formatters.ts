import type {
  LoyaltySummaryMetric,
  LoyaltyTransactionSource,
  LoyaltyTransactionStatus,
  LoyaltyTransactionType,
} from "@/features/loyalty/types";
import type { AdminLanguage } from "@/modules/localization/types";

export const normalizeDecimalInput = (value: string) =>
  value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");

export const formatPoints = (
  value: string | null | undefined,
  language: AdminLanguage = "en",
  fallback = "-"
) => {
  if (!value) return fallback;
  return language === "ar" ? `${value} نقطة` : `${value} pts`;
};

export const formatMoney = (
  value: string | null | undefined,
  language: AdminLanguage = "en",
  currency = language === "ar" ? "ج.م" : "EGP",
  fallback = "-"
) => {
  if (!value) return fallback;
  return `${value} ${currency}`;
};

export const formatDateTime = (
  value: string | null | undefined,
  language: AdminLanguage = "en",
  fallback = "-"
) => {
  if (!value) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return new Intl.DateTimeFormat(language === "ar" ? "ar-EG" : "en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
};

export const getTransactionTypeLabel = (
  type: LoyaltyTransactionType,
  t: (key: string, fallback?: string) => string
) => t(`loyalty.type.${camelize(type)}`, type);

export const getTransactionStatusLabel = (
  status: LoyaltyTransactionStatus,
  t: (key: string, fallback?: string) => string
) => t(`loyalty.status.${camelize(status)}`, status);

export const getTransactionSourceLabel = (
  source: LoyaltyTransactionSource,
  t: (key: string, fallback?: string) => string
) => t(`loyalty.source.${camelize(source)}`, source);

export const formatSummaryMetric = (
  metric: LoyaltySummaryMetric,
  language: AdminLanguage,
  t: (key: string, fallback?: string) => string
) => {
  const label = t(metric.labelKey, humanize(metric.key));
  if (metric.kind === "points") return { label, value: formatPoints(metric.value, language) };
  if (metric.kind === "money") return { label, value: formatMoney(metric.value, language) };
  return { label, value: metric.value };
};

const camelize = (value: string) =>
  value
    .toLowerCase()
    .split("_")
    .map((segment, index) => (index === 0 ? segment : `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`))
    .join("");

const humanize = (value: string) =>
  value
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\w/, (char) => char.toUpperCase());
