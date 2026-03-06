import { costsSeed, purchaseRowsSeed } from "@/components/purchases/mock-data";
import type { CostRow, PurchaseRow } from "@/components/purchases/types";

const PURCHASES_KEY = "purchases_module_rows_v1";
const COSTS_KEY = "purchases_module_costs_v1";
const UPDATE_EVENT = "purchases-data-updated";

const isBrowser = () => typeof window !== "undefined";

const parseRows = <T>(raw: string | null): T[] | null => {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : null;
  } catch {
    return null;
  }
};

const emitUpdate = () => {
  if (!isBrowser()) {
    return;
  }
  window.dispatchEvent(new Event(UPDATE_EVENT));
};

export const getPurchasesStorageEventName = () => UPDATE_EVENT;

export const loadPurchaseRows = (): PurchaseRow[] => {
  if (!isBrowser()) {
    return purchaseRowsSeed;
  }
  const parsed = parseRows<PurchaseRow>(window.localStorage.getItem(PURCHASES_KEY));
  return parsed ?? purchaseRowsSeed;
};

export const savePurchaseRows = (rows: PurchaseRow[]) => {
  if (!isBrowser()) {
    return;
  }
  window.localStorage.setItem(PURCHASES_KEY, JSON.stringify(rows));
  emitUpdate();
};

export const loadCostRows = (): CostRow[] => {
  if (!isBrowser()) {
    return costsSeed;
  }
  const parsed = parseRows<CostRow>(window.localStorage.getItem(COSTS_KEY));
  return parsed ?? costsSeed;
};

export const saveCostRows = (rows: CostRow[]) => {
  if (!isBrowser()) {
    return;
  }
  window.localStorage.setItem(COSTS_KEY, JSON.stringify(rows));
  emitUpdate();
};
