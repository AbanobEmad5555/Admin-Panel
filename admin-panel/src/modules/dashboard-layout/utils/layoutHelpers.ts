import type { AdminNavigation } from "@/features/admin-auth/types";
import { DASHBOARD_MODULE_REGISTRY } from "@/modules/dashboard-layout/utils/moduleRegistry";
import type {
  DashboardLayoutApiItem,
  DashboardLayoutItem,
  DashboardModuleId,
  DashboardModuleRecord,
} from "@/modules/dashboard-layout/types/dashboardLayout.types";

export const isDashboardModuleId = (value: string): value is DashboardModuleId =>
  value in DASHBOARD_MODULE_REGISTRY;

export const sortLayout = (modules: DashboardLayoutItem[]) =>
  [...modules].sort((a, b) => a.position - b.position);

export const normalizeLayoutPositions = (modules: DashboardLayoutItem[]) =>
  modules.map((module, index) => ({
    ...module,
    position: index + 1,
  }));

export const getNavigationDashboardLayout = (
  navigation: AdminNavigation | null | undefined
): DashboardLayoutItem[] =>
  normalizeLayoutPositions(
    (navigation?.modules ?? [])
      .filter((moduleItem): moduleItem is AdminNavigation["modules"][number] & { moduleId: DashboardModuleId } =>
        isDashboardModuleId(moduleItem.moduleId)
      )
      .sort((left, right) => left.position - right.position)
      .map((moduleItem) => ({
        moduleId: moduleItem.moduleId,
        position: moduleItem.position,
        isVisible: moduleItem.isVisible,
      }))
  );

const sanitizeLayoutItem = (item: DashboardLayoutApiItem): DashboardLayoutItem | null => {
  if (!item.moduleId || !isDashboardModuleId(item.moduleId)) {
    return null;
  }

  return {
    moduleId: item.moduleId,
    position: typeof item.position === "number" && Number.isFinite(item.position) ? item.position : 0,
    isVisible: typeof item.isVisible === "boolean" ? item.isVisible : true,
  };
};

export const mergeLayoutWithNavigation = (
  layout: DashboardLayoutApiItem[] | DashboardLayoutItem[],
  navigationLayout: DashboardLayoutItem[] = []
) => {
  const sanitized = layout
    .map((item) => sanitizeLayoutItem(item))
    .filter((item): item is DashboardLayoutItem => Boolean(item));

  const deduped = new Map<DashboardModuleId, DashboardLayoutItem>();
  sortLayout(sanitized).forEach((item) => {
    deduped.set(item.moduleId, item);
  });

  const merged = [...deduped.values()];

  navigationLayout.forEach((moduleItem) => {
    if (!deduped.has(moduleItem.moduleId)) {
      merged.push({
        moduleId: moduleItem.moduleId,
        position: merged.length + 1,
        isVisible: moduleItem.isVisible,
      });
    }
  });

  return normalizeLayoutPositions(merged);
};

export const toDashboardModuleRecords = (layout: DashboardLayoutItem[]): DashboardModuleRecord[] =>
  normalizeLayoutPositions(layout).map((item) => ({
    ...item,
    ...DASHBOARD_MODULE_REGISTRY[item.moduleId],
  }));

export const getVisibleModules = (layout: DashboardLayoutItem[]) =>
  sortLayout(layout).filter((item) => item.isVisible);

export const getHiddenModules = (layout: DashboardLayoutItem[]) =>
  sortLayout(layout).filter((item) => !item.isVisible);

export const ensureLayoutHasNavigationModules = (
  layout: DashboardLayoutItem[],
  navigationLayout: DashboardLayoutItem[]
) => {
  const deduped = new Map<DashboardModuleId, DashboardLayoutItem>();
  sortLayout(layout).forEach((item) => {
    deduped.set(item.moduleId, item);
  });

  navigationLayout.forEach((moduleItem) => {
    if (!deduped.has(moduleItem.moduleId)) {
      deduped.set(moduleItem.moduleId, {
        moduleId: moduleItem.moduleId,
        position: deduped.size + 1,
        isVisible: moduleItem.isVisible,
      });
    }
  });

  return normalizeLayoutPositions(Array.from(deduped.values()));
};

export const reorderLayout = (
  layout: DashboardLayoutItem[],
  activeModuleId: DashboardModuleId,
  overModuleId: DashboardModuleId
) => {
  const ordered = sortLayout(layout);
  const activeIndex = ordered.findIndex((item) => item.moduleId === activeModuleId);
  const overIndex = ordered.findIndex((item) => item.moduleId === overModuleId);

  if (activeIndex === -1 || overIndex === -1) {
    return ordered;
  }

  const next = [...ordered];
  const [moved] = next.splice(activeIndex, 1);
  next.splice(overIndex, 0, moved);
  return normalizeLayoutPositions(next);
};

export const reorderVisibleLayout = (
  layout: DashboardLayoutItem[],
  activeModuleId: DashboardModuleId,
  overModuleId: DashboardModuleId
) => {
  const ordered = sortLayout(layout);
  const visibleModules = ordered.filter((item) => item.isVisible);
  const hiddenModules = ordered.filter((item) => !item.isVisible);
  const activeIndex = visibleModules.findIndex((item) => item.moduleId === activeModuleId);
  const overIndex = visibleModules.findIndex((item) => item.moduleId === overModuleId);

  if (activeIndex === -1 || overIndex === -1) {
    return ordered;
  }

  const reorderedVisibleModules = [...visibleModules];
  const [moved] = reorderedVisibleModules.splice(activeIndex, 1);
  reorderedVisibleModules.splice(overIndex, 0, moved);

  return normalizeLayoutPositions([...reorderedVisibleModules, ...hiddenModules]);
};

export const setModuleVisibility = (
  layout: DashboardLayoutItem[],
  moduleId: DashboardModuleId,
  isVisible: boolean
) =>
  normalizeLayoutPositions(
    layout.map((item) =>
      item.moduleId === moduleId
        ? {
            ...item,
            isVisible,
          }
        : item
    )
  );
