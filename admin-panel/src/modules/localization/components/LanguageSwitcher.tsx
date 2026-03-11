"use client";

import { useLocalization } from "@/modules/localization/LocalizationProvider";

export default function LanguageSwitcher() {
  const { isUpdating, language, setLanguage, t } = useLocalization();

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 p-1">
      <span className="px-2 text-xs font-medium text-slate-500">
        {t("language.label")}
      </span>
      {(["en", "ar"] as const).map((option) => {
        const isActive = language === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => setLanguage(option)}
            disabled={isUpdating}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              isActive
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-white"
            }`}
          >
            {option.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
