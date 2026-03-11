import type { AdminLanguage } from "@/modules/localization/types";

type LocalizedValueInput = {
  en?: string | null;
  ar?: string | null;
  legacy?: string | null;
  lang: AdminLanguage;
};

const clean = (value?: string | null) => {
  const normalized = value?.trim();
  return normalized ? normalized : "";
};

export const getLocalizedValue = ({
  en,
  ar,
  legacy,
  lang,
}: LocalizedValueInput) => {
  const valueEn = clean(en);
  const valueAr = clean(ar);
  const legacyValue = clean(legacy);

  if (lang === "ar") {
    return valueAr || valueEn || legacyValue;
  }

  return valueEn || valueAr || legacyValue;
};

export const mapLegacyNameToBilingual = (legacy?: string | null) => ({
  en: clean(legacy),
  ar: "",
});

export const getDocumentDirection = (language: AdminLanguage) =>
  language === "ar" ? "rtl" : "ltr";

export const getTextAlignClass = (language: AdminLanguage) =>
  language === "ar" ? "text-right" : "text-left";
