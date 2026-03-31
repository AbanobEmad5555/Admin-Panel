"use client";

import { useSyncExternalStore } from "react";

let hasHydrated = false;
const listeners = new Set<() => void>();

const notifyHydrated = () => {
  if (hasHydrated) {
    return;
  }

  hasHydrated = true;
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);

  if (typeof window !== "undefined" && !hasHydrated) {
    queueMicrotask(notifyHydrated);
  }

  return () => {
    listeners.delete(listener);
  };
};

export const useHasHydrated = () =>
  useSyncExternalStore(subscribe, () => hasHydrated, () => false);

