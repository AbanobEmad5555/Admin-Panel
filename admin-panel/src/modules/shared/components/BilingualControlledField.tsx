"use client";

import Input from "@/components/ui/Input";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

type BilingualControlledFieldProps = {
  label: string;
  valueEn: string;
  valueAr: string;
  onChangeEn: (value: string) => void;
  onChangeAr: (value: string) => void;
  placeholderEn?: string;
  placeholderAr?: string;
  requiredEn?: boolean;
};

export default function BilingualControlledField({
  label,
  valueEn,
  valueAr,
  onChangeEn,
  onChangeAr,
  placeholderEn,
  placeholderAr,
  requiredEn = false,
}: BilingualControlledFieldProps) {
  const { t } = useLocalization();

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            {label} ({t("language.english")})
            {requiredEn ? " *" : ""}
          </label>
          <Input
            value={valueEn}
            onChange={(event) => onChangeEn(event.target.value)}
            placeholder={placeholderEn ?? t("field.englishValue")}
            dir="ltr"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            {label} ({t("language.arabic")})
          </label>
          <Input
            value={valueAr}
            onChange={(event) => onChangeAr(event.target.value)}
            placeholder={placeholderAr ?? t("field.arabicValue")}
            dir="rtl"
            className="text-right"
          />
        </div>
      </div>
    </div>
  );
}
