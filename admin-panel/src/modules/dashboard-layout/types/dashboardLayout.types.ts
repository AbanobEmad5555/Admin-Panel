import type { LucideIcon } from "lucide-react";
import type { AdminLanguage } from "@/modules/localization/types";

export type DashboardModuleId =
  | "dashboards"
  | "inventory"
  | "crm"
  | "calendar"
  | "pos"
  | "invoices"
  | "purchases"
  | "website"
  | "promo-codes"
  | "team"
  | "loyalty-program";

export type DashboardLayoutItem = {
  moduleId: DashboardModuleId;
  position: number;
  isVisible: boolean;
};

export type DashboardLayoutApiItem = {
  moduleId?: string;
  position?: number;
  isVisible?: boolean;
};

export type DashboardLayoutPayload = {
  modules: DashboardLayoutItem[];
};

export type DashboardLayoutEnvelope<T> = {
  success: boolean;
  data: T;
  message: string | null;
};

export type DashboardModuleCopy = {
  title: string;
  description: string;
  comingSoon: string;
};

export type DashboardModuleDefinition = {
  moduleId: DashboardModuleId;
  route: string;
  enabled: boolean;
  icon: LucideIcon;
  copy: Record<AdminLanguage, DashboardModuleCopy>;
};

export type DashboardModuleRecord = DashboardLayoutItem & DashboardModuleDefinition;
