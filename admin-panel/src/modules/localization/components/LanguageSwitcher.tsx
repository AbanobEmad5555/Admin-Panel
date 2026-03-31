"use client";

import { useLocalization } from "@/modules/localization/LocalizationProvider";

export default function LanguageSwitcher() {
  const { isUpdating, language, setLanguage, t } = useLocalization();

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 p-1.5 backdrop-blur-xl">
      <span className="px-2 text-xs font-medium text-slate-400">{t("language.label")}</span>
      {(["en", "ar"] as const).map((option) => {
        const isActive = language === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => setLanguage(option)}
            disabled={isUpdating}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold tracking-[-0.02em] transition-all duration-300 ${
              isActive
                ? "bg-[linear-gradient(135deg,rgba(6,182,212,0.95),rgba(168,85,247,0.9))] text-white shadow-[0_0_20px_rgba(56,189,248,0.2)]"
                : "text-slate-300 hover:bg-white/8 hover:text-white"
            }`}
          >
            {option.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
