"use client";

import { useMemo, useState } from "react";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

export type PromoCodeFormValues = {
  code: string;
  type: "FIXED" | "PERCENTAGE";
  value: string;
  minimum_order_price: string;
  max_discount_amount: string;
  expire_date: string;
  max_usage_per_user: string;
  max_total_usage: string;
  is_active: boolean;
};

type PromoCodeFormErrors = {
  code?: string;
  type?: string;
  value?: string;
  minimum_order_price?: string;
  max_discount_amount?: string;
  expire_date?: string;
  max_usage_per_user?: string;
  max_total_usage?: string;
};

type PromoCodeFormModalProps = {
  isOpen: boolean;
  mode: "create" | "edit";
  initialValues?: PromoCodeFormValues;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: PromoCodeFormValues) => Promise<void>;
};

const emptyForm: PromoCodeFormValues = {
  code: "",
  type: "FIXED",
  value: "",
  minimum_order_price: "",
  max_discount_amount: "",
  expire_date: "",
  max_usage_per_user: "",
  max_total_usage: "",
  is_active: true,
};

const isValidDate = (value: string) => {
  const date = new Date(value);
  if (
    value.trim().length === 0 ||
    Number.isNaN(date.getTime()) ||
    value !== date.toISOString().split("T")[0]
  ) {
    return false;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
};

export default function PromoCodeFormModal({
  isOpen,
  mode,
  initialValues,
  isSubmitting,
  onClose,
  onSubmit,
}: PromoCodeFormModalProps) {
  const { language } = useLocalization();
  const initialFormState = useMemo(
    () => initialValues ?? emptyForm,
    [initialValues],
  );
  const [form, setForm] = useState<PromoCodeFormValues>(initialFormState);
  const [errors, setErrors] = useState<PromoCodeFormErrors>({});
  const text =
    language === "ar"
      ? {
          addTitle: "إضافة كود خصم",
          editTitle: "تعديل كود الخصم",
          code: "الكود",
          codePlaceholder: "أدخل كود الخصم",
          type: "النوع",
          fixed: "ثابت",
          percentage: "نسبة مئوية",
          value: "القيمة",
          valuePlaceholder: "قيمة رقمية",
          minimumOrderPrice: "الحد الأدنى لسعر الطلب",
          maxDiscountAmount: "أقصى مبلغ خصم",
          expireDate: "تاريخ الانتهاء",
          maxUsagePerUser: "أقصى استخدام لكل مستخدم",
          maxTotalUsage: "أقصى استخدام إجمالي",
          active: "نشط",
          cancel: "إلغاء",
          saving: "جارٍ الحفظ...",
          save: "حفظ",
          codeRequired: "الكود مطلوب.",
          typeRequired: "النوع مطلوب.",
          valueRequired: "القيمة مطلوبة.",
          valueNumber: "يجب أن تكون القيمة رقمًا.",
          fixedPositive: "يجب أن تكون القيمة الثابتة أكبر من صفر.",
          percentageRange: "يجب أن تكون النسبة بين 1 و100.",
          minOrderRequired: "الحد الأدنى لسعر الطلب مطلوب.",
          numberMinZero: "يجب أن تكون قيمة رقمية أكبر من أو تساوي 0.",
          maxDiscountRequired: "أقصى مبلغ خصم مطلوب.",
          expireRequired: "تاريخ الانتهاء مطلوب.",
          expireInvalid: "يجب أن يكون تاريخ الانتهاء صالحًا بصيغة YYYY-MM-DD.",
          maxPerUserRequired: "أقصى استخدام لكل مستخدم مطلوب.",
          numberMinOne: "يجب أن تكون قيمة رقمية أكبر من أو تساوي 1.",
          maxTotalRequired: "أقصى استخدام إجمالي مطلوب.",
        }
      : {
          addTitle: "Add Promo Code",
          editTitle: "Edit Promo Code",
          code: "Code",
          codePlaceholder: "Enter promo code",
          type: "Type",
          fixed: "Fixed",
          percentage: "Percentage",
          value: "Value",
          valuePlaceholder: "Numeric value",
          minimumOrderPrice: "Minimum order price",
          maxDiscountAmount: "Max discount amount",
          expireDate: "Expire date",
          maxUsagePerUser: "Max usage / user",
          maxTotalUsage: "Max total usage",
          active: "Active",
          cancel: "Cancel",
          saving: "Saving...",
          save: "Save",
          codeRequired: "Code is required.",
          typeRequired: "Type is required.",
          valueRequired: "Value is required.",
          valueNumber: "Value must be a number.",
          fixedPositive: "Fixed value must be greater than zero.",
          percentageRange: "Percentage must be between 1 and 100.",
          minOrderRequired: "Minimum order price is required.",
          numberMinZero: "Must be a number >= 0.",
          maxDiscountRequired: "Max discount amount is required.",
          expireRequired: "Expire date is required.",
          expireInvalid: "Expire date must be a valid YYYY-MM-DD.",
          maxPerUserRequired: "Max usage per user is required.",
          numberMinOne: "Must be a number >= 1.",
          maxTotalRequired: "Max total usage is required.",
        };

  const title = mode === "create" ? text.addTitle : text.editTitle;

  const validate = () => {
    const nextErrors: PromoCodeFormErrors = {};
    const trimmedCode = form.code.trim();
    if (!trimmedCode) {
      nextErrors.code = text.codeRequired;
    }
    if (!form.type) {
      nextErrors.type = text.typeRequired;
    }
    const parsedValue = Number(form.value);
    if (!form.value.trim()) {
      nextErrors.value = text.valueRequired;
    } else if (Number.isNaN(parsedValue)) {
      nextErrors.value = text.valueNumber;
    } else if (form.type === "FIXED" && parsedValue <= 0) {
      nextErrors.value = text.fixedPositive;
    } else if (
      form.type === "PERCENTAGE" &&
      (parsedValue < 1 || parsedValue > 100)
    ) {
      nextErrors.value = text.percentageRange;
    }
    const minOrder = Number(form.minimum_order_price);
    if (!form.minimum_order_price.trim()) {
      nextErrors.minimum_order_price = text.minOrderRequired;
    } else if (Number.isNaN(minOrder) || minOrder < 0) {
      nextErrors.minimum_order_price = text.numberMinZero;
    }
    const maxDiscount = Number(form.max_discount_amount);
    if (!form.max_discount_amount.trim()) {
      nextErrors.max_discount_amount = text.maxDiscountRequired;
    } else if (Number.isNaN(maxDiscount) || maxDiscount < 0) {
      nextErrors.max_discount_amount = text.numberMinZero;
    }
    if (!form.expire_date.trim()) {
      nextErrors.expire_date = text.expireRequired;
    } else if (!isValidDate(form.expire_date)) {
      nextErrors.expire_date = text.expireInvalid;
    }
    const perUser = Number(form.max_usage_per_user);
    if (!form.max_usage_per_user.trim()) {
      nextErrors.max_usage_per_user = text.maxPerUserRequired;
    } else if (Number.isNaN(perUser) || perUser < 1) {
      nextErrors.max_usage_per_user = text.numberMinOne;
    }
    const totalUsage = Number(form.max_total_usage);
    if (!form.max_total_usage.trim()) {
      nextErrors.max_total_usage = text.maxTotalRequired;
    } else if (Number.isNaN(totalUsage) || totalUsage < 1) {
      nextErrors.max_total_usage = text.numberMinOne;
    }
    setErrors(nextErrors);
    return nextErrors;
  };

  const handleSubmit = async () => {
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    await onSubmit({
      ...form,
      code: form.code.trim().toUpperCase(),
    });
  };

  const numericInputProps = {
    inputMode: "decimal" as const,
    pattern: "[0-9]*",
  };

  const expireMin = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  }, []);

  return (
    <Modal title={title} isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700">{text.code}</label>
          <Input
            value={form.code}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, code: event.target.value }))
            }
            placeholder={text.codePlaceholder}
          />
          {errors.code ? (
            <p className="mt-1 text-xs text-rose-600">{errors.code}</p>
          ) : null}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">{text.type}</label>
          <select
            value={form.type}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                type: event.target.value as PromoCodeFormValues["type"],
              }))
            }
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            <option value="FIXED">{text.fixed}</option>
            <option value="PERCENTAGE">{text.percentage}</option>
          </select>
          {errors.type ? (
            <p className="mt-1 text-xs text-rose-600">{errors.type}</p>
          ) : null}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">{text.value}</label>
          <Input
            value={form.value}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, value: event.target.value }))
            }
            placeholder={text.valuePlaceholder}
            {...numericInputProps}
          />
          {errors.value ? (
            <p className="mt-1 text-xs text-rose-600">{errors.value}</p>
          ) : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-700">
              {text.minimumOrderPrice}
            </label>
            <Input
              value={form.minimum_order_price}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  minimum_order_price: event.target.value,
                }))
              }
              placeholder="0"
              {...numericInputProps}
            />
            {errors.minimum_order_price ? (
              <p className="mt-1 text-xs text-rose-600">
                {errors.minimum_order_price}
              </p>
            ) : null}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">
              {text.maxDiscountAmount}
            </label>
            <Input
              value={form.max_discount_amount}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  max_discount_amount: event.target.value,
                }))
              }
              placeholder="0"
              {...numericInputProps}
            />
            {errors.max_discount_amount ? (
              <p className="mt-1 text-xs text-rose-600">
                {errors.max_discount_amount}
              </p>
            ) : null}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">{text.expireDate}</label>
          <Input
            type="date"
            value={form.expire_date}
            min={expireMin}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, expire_date: event.target.value }))
            }
          />
          {errors.expire_date ? (
            <p className="mt-1 text-xs text-rose-600">{errors.expire_date}</p>
          ) : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-700">
              {text.maxUsagePerUser}
            </label>
            <Input
              value={form.max_usage_per_user}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  max_usage_per_user: event.target.value,
                }))
              }
              placeholder="1"
              {...numericInputProps}
            />
            {errors.max_usage_per_user ? (
              <p className="mt-1 text-xs text-rose-600">
                {errors.max_usage_per_user}
              </p>
            ) : null}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">
              {text.maxTotalUsage}
            </label>
            <Input
              value={form.max_total_usage}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  max_total_usage: event.target.value,
                }))
              }
              placeholder="1"
              {...numericInputProps}
            />
            {errors.max_total_usage ? (
              <p className="mt-1 text-xs text-rose-600">
                {errors.max_total_usage}
              </p>
            ) : null}
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4 accent-slate-900"
            checked={form.is_active}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, is_active: event.target.checked }))
            }
          />
          {text.active}
        </label>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {text.cancel}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? text.saving : text.save}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
