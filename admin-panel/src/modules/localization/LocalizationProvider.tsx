"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useTransition,
  type ReactNode,
} from "react";
import { localizationDictionaries } from "@/modules/localization/dictionaries";
import { useAdminLocalization, useUpdateAdminLocalization } from "@/modules/localization/hooks";
import type { AdminLanguage } from "@/modules/localization/types";
import { getDocumentDirection } from "@/modules/localization/utils";

type LocalizationContextValue = {
  language: AdminLanguage;
  direction: "ltr" | "rtl";
  isLoading: boolean;
  isUpdating: boolean;
  setLanguage: (language: AdminLanguage) => void;
  t: (key: string, fallback?: string) => string;
};

const LocalizationContext = createContext<LocalizationContextValue | null>(null);

type LocalizationProviderProps = {
  children: ReactNode;
};

export function LocalizationProvider({ children }: LocalizationProviderProps) {
  const [isPending, startTransition] = useTransition();
  const query = useAdminLocalization();
  const updateMutation = useUpdateAdminLocalization();

  const language = query.data?.language ?? "en";
  const direction = getDocumentDirection(language);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.documentElement.lang = language;
    document.documentElement.dir = direction;
    document.body.dir = direction;
  }, [direction, language]);

  const value = useMemo<LocalizationContextValue>(() => {
    const dictionary = localizationDictionaries[language];

    return {
      language,
      direction,
      isLoading: query.isLoading,
      isUpdating: isPending || updateMutation.isPending,
      setLanguage: (nextLanguage) => {
        if (nextLanguage === language) {
          return;
        }

        startTransition(() => {
          updateMutation.mutate(nextLanguage);
        });
      },
      t: (key, fallback) => dictionary[key] ?? fallback ?? key,
    };
  }, [direction, isPending, language, query.isLoading, updateMutation]);

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
}

export const useLocalization = () => {
  const context = useContext(LocalizationContext);

  if (!context) {
    throw new Error("useLocalization must be used within LocalizationProvider");
  }

  return context;
};
