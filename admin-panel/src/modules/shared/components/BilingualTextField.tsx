"use client";

import type { FieldValues, Path, UseFormRegister } from "react-hook-form";
import Input from "@/components/ui/Input";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

type BilingualTextFieldProps<TFieldValues extends FieldValues> = {
  register: UseFormRegister<TFieldValues>;
  nameEnField: Path<TFieldValues>;
  nameArField: Path<TFieldValues>;
  label: string;
  showGroupLabel?: boolean;
  placeholderEn?: string;
  placeholderAr?: string;
  requiredEn?: boolean;
  requiredAr?: boolean;
  errors?: Partial<Record<Path<TFieldValues>, { message?: string }>>;
};

export default function BilingualTextField<TFieldValues extends FieldValues>({
  register,
  nameEnField,
  nameArField,
  label,
  showGroupLabel = true,
  placeholderEn,
  placeholderAr,
  requiredEn = false,
  requiredAr = false,
  errors,
}: BilingualTextFieldProps<TFieldValues>) {
  const { t } = useLocalization();

  return (
    <div className="space-y-3">
      {showGroupLabel ? <div className="text-sm font-medium text-slate-900">{label}</div> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            {label} ({t("language.english")})
            {requiredEn ? " *" : ""}
          </label>
          <Input
            {...register(nameEnField)}
            placeholder={placeholderEn ?? t("field.englishValue")}
            dir="ltr"
          />
          {errors?.[nameEnField]?.message ? (
            <p className="mt-1 text-xs text-rose-600">
              {errors[nameEnField]?.message}
            </p>
          ) : null}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            {label} ({t("language.arabic")})
            {requiredAr ? " *" : ""}
          </label>
          <Input
            {...register(nameArField)}
            placeholder={placeholderAr ?? t("field.arabicValue")}
            dir="rtl"
            className="text-right"
          />
          {errors?.[nameArField]?.message ? (
            <p className="mt-1 text-xs text-rose-600">
              {errors[nameArField]?.message}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
