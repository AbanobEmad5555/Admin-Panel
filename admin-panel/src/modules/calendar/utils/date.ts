import { format, isValid, parseISO } from "date-fns";

const asDate = (value: string | Date | null | undefined) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const parsed = parseISO(value);
  if (isValid(parsed)) {
    return parsed;
  }

  const fallback = new Date(value);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
};

export const toMonthParam = (value: Date) => format(value, "yyyy-MM");

export const formatDateLabel = (
  value: string | Date | null | undefined,
  fallback = "-",
) => {
  const parsed = asDate(value);
  if (!parsed) {
    return fallback;
  }
  return format(parsed, "MMM d, yyyy");
};

export const formatDateTimeLabel = (
  value: string | Date | null | undefined,
  fallback = "-",
) => {
  const parsed = asDate(value);
  if (!parsed) {
    return fallback;
  }
  return format(parsed, "MMM d, yyyy h:mm a");
};

export const formatCurrency = (value: number, currency = "EGP", locale = "en-US") =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

export const utcIsoToDateTimeInputValue = (value: string | null | undefined) => {
  const parsed = asDate(value);
  if (!parsed) {
    return "";
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const utcIsoToDateInputValue = (value: string | null | undefined) => {
  const parsed = asDate(value);
  if (!parsed) {
    return "";
  }

  return format(parsed, "yyyy-MM-dd");
};

export const localDateTimeInputToUtcIso = (value: string) => {
  if (!value) {
    return "";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  return parsed.toISOString();
};

export const localDateInputToUtcIso = (value: string) => {
  if (!value) {
    return "";
  }
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  return parsed.toISOString();
};

