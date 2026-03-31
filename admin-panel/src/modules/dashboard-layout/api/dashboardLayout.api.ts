import api from "@/services/api";
import type {
  DashboardLayoutEnvelope,
  DashboardLayoutItem,
  DashboardLayoutPayload,
} from "@/modules/dashboard-layout/types/dashboardLayout.types";
import {
  mergeLayoutWithNavigation,
  normalizeLayoutPositions,
} from "@/modules/dashboard-layout/utils/layoutHelpers";

const BASE_PATH = "/api/admin/dashboard-layout";

type LayoutResponseData =
  | DashboardLayoutItem[]
  | {
      modules?: DashboardLayoutItem[];
    };

const isLayoutEnvelope = (
  payload: LayoutResponseData | DashboardLayoutEnvelope<LayoutResponseData>
): payload is DashboardLayoutEnvelope<LayoutResponseData> =>
  typeof payload === "object" && payload !== null && "success" in payload && "data" in payload;

const extractLayout = (
  payload: LayoutResponseData | DashboardLayoutEnvelope<LayoutResponseData>,
  fallbackModules?: DashboardLayoutItem[]
) => {
  const data: LayoutResponseData = isLayoutEnvelope(payload) ? payload.data : payload;
  const modules = Array.isArray(data)
    ? data
    : Array.isArray(data?.modules)
      ? data.modules
      : fallbackModules ?? [];
  return mergeLayoutWithNavigation(modules, fallbackModules);
};

export const getDashboardLayout = async () => {
  const response = await api.get<DashboardLayoutEnvelope<LayoutResponseData>>(BASE_PATH);
  return extractLayout(response.data);
};

export const saveDashboardLayout = async (modules: DashboardLayoutItem[]) => {
  const payload: DashboardLayoutPayload = { modules: normalizeLayoutPositions(modules) };
  const response = await api.patch<DashboardLayoutEnvelope<LayoutResponseData>>(BASE_PATH, payload);
  return extractLayout(response.data, payload.modules);
};

export const updateDashboardModuleVisibility = async (
  moduleId: DashboardLayoutItem["moduleId"],
  isVisible: boolean,
  fallbackModules?: DashboardLayoutItem[]
) => {
  const response = await api.patch<DashboardLayoutEnvelope<LayoutResponseData>>(`${BASE_PATH}/module`, {
    moduleId,
    isVisible,
  });
  return extractLayout(response.data, fallbackModules);
};
