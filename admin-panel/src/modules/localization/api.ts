import api from "@/services/api";
import { getAdminToken } from "@/lib/auth";
import type { LocalizationSettings } from "@/modules/localization/types";

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  message?: string | null;
};

export const localizationApi = {
  async getSettings() {
    if (!getAdminToken()) {
      return readStoredLocalizationSettings();
    }

    try {
      const response = await api.get<ApiEnvelope<LocalizationSettings>>(
        "/api/admin/settings/localization"
      );

      const settings = response.data?.data ?? readStoredLocalizationSettings();
      writeStoredLocalizationSettings(settings);
      return settings;
    } catch {
      return readStoredLocalizationSettings();
    }
  },

  async updateSettings(language: LocalizationSettings["language"]) {
    if (!getAdminToken()) {
      const settings = { language };
      writeStoredLocalizationSettings(settings);
      return settings;
    }

    try {
      const response = await api.patch<ApiEnvelope<LocalizationSettings>>(
        "/api/admin/settings/localization",
        { language }
      );

      const settings = response.data?.data ?? { language };
      writeStoredLocalizationSettings(settings);
      return settings;
    } catch {
      const settings = { language };
      writeStoredLocalizationSettings(settings);
      return settings;
    }
  },
};

const LOCALIZATION_STORAGE_KEY = "admin-localization-settings";

export const readStoredLocalizationSettings = (): LocalizationSettings => {
  if (typeof window === "undefined") {
    return { language: "en" };
  }

  const raw = window.localStorage.getItem(LOCALIZATION_STORAGE_KEY);
  if (!raw) {
    return { language: "en" };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<LocalizationSettings>;
    return {
      language: parsed.language === "ar" ? "ar" : "en",
    };
  } catch {
    return { language: "en" };
  }
};

export const writeStoredLocalizationSettings = (settings: LocalizationSettings) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    LOCALIZATION_STORAGE_KEY,
    JSON.stringify(settings)
  );
};
