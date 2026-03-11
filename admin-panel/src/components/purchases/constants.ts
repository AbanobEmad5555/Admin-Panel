import type { CostCategory, PurchaseStatus } from "@/components/purchases/types";

export const purchaseStatuses: PurchaseStatus[] = [
  "ORDERED",
  "IN_TRANSIT",
  "DELIVERED",
  "CANCELLED",
];

export const costCategories: CostCategory[] = [
  "RENT",
  "UTILITIES",
  "SALARY",
  "MARKETING",
  "SHIPPING",
  "MISCELLANEOUS",
];

export const costCategoryLabels: Record<CostCategory, string> = {
  RENT: "Rent",
  UTILITIES: "Utilities",
  SALARY: "Salary",
  MARKETING: "Marketing",
  SHIPPING: "Shipping",
  MISCELLANEOUS: "Miscellaneous",
};

export const costCategoryArabicLabels: Record<CostCategory, string> = {
  RENT: "إيجار",
  UTILITIES: "مرافق",
  SALARY: "رواتب",
  MARKETING: "تسويق",
  SHIPPING: "شحن",
  MISCELLANEOUS: "متنوع",
};

export const costBreakdownPalette = [
  { key: "RENT", label: "Rent", color: "#334155" },
  { key: "SALARY", label: "Salary", color: "#0f766e" },
  { key: "UTILITIES", label: "Utilities", color: "#0369a1" },
  { key: "MARKETING", label: "Marketing", color: "#7c3aed" },
  { key: "SHIPPING", label: "Shipping", color: "#ca8a04" },
  { key: "MISCELLANEOUS", label: "Miscellaneous", color: "#475569" },
];
