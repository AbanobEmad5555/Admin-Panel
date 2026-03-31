"use client";

import { useSyncExternalStore } from "react";
import { ADMIN_TOKEN_EVENT, getAdminToken } from "@/lib/auth";

const subscribe = (onStoreChange: () => void) => {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleChange = () => onStoreChange();
  window.addEventListener("storage", handleChange);
  window.addEventListener(ADMIN_TOKEN_EVENT, handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(ADMIN_TOKEN_EVENT, handleChange);
  };
};

export const useAdminTokenPresence = (): boolean | null => {
  return useSyncExternalStore<boolean | null>(
    subscribe,
    () => Boolean(getAdminToken()),
    () => null
  );
};
