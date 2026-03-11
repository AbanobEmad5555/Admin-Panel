"use client";

import { useLocalization } from "@/modules/localization/LocalizationProvider";
import { getLocalizedValue } from "@/modules/localization/utils";

type LocalizedDisplayTextProps = {
  valueEn?: string | null;
  valueAr?: string | null;
  legacyValue?: string | null;
  fallback?: string;
  className?: string;
};

export default function LocalizedDisplayText({
  valueEn,
  valueAr,
  legacyValue,
  fallback = "-",
  className = "",
}: LocalizedDisplayTextProps) {
  const { language } = useLocalization();
  const value = getLocalizedValue({
    en: valueEn,
    ar: valueAr,
    legacy: legacyValue,
    lang: language,
  });

  return <span className={className}>{value || fallback}</span>;
}
