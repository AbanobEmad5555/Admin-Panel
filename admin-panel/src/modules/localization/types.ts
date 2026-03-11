export type AdminLanguage = "en" | "ar";

export type LocalizationSettings = {
  language: AdminLanguage;
};

export type TranslationDictionary = Record<string, string>;
