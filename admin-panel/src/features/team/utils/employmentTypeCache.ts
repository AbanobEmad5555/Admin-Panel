import type { EmploymentType } from "@/features/team/types";

const STORAGE_KEY = "teamEmploymentTypeCache";

type EmploymentTypeCache = Record<string, EmploymentType>;

const isEmploymentType = (value: unknown): value is EmploymentType =>
  value === "FULL_TIME" || value === "PART_TIME" || value === "TRAINEE";

const readCache = (): EmploymentTypeCache => {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const normalized: EmploymentTypeCache = {};
    Object.entries(parsed).forEach(([employeeId, value]) => {
      if (isEmploymentType(value)) {
        normalized[employeeId] = value;
      }
    });
    return normalized;
  } catch {
    return {};
  }
};

const writeCache = (cache: EmploymentTypeCache) => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage errors; this is a best-effort UI fallback.
  }
};

export const getCachedEmploymentType = (employeeId: string): EmploymentType | null => {
  const cache = readCache();
  return cache[employeeId] ?? null;
};

export const setCachedEmploymentType = (employeeId: string, employmentType?: EmploymentType) => {
  if (!employmentType) {
    return;
  }
  const cache = readCache();
  cache[employeeId] = employmentType;
  writeCache(cache);
};

