"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import {
  costCategories,
  costCategoryArabicLabels,
  costCategoryLabels,
} from "@/components/purchases/constants";
import type { CostFormValue, CostRow } from "@/components/purchases/types";
import { useForm } from "react-hook-form";
import BilingualTextField from "@/modules/shared/components/BilingualTextField";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

type CostFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  initial?: CostRow | null;
  onClose: () => void;
  onSubmit: (payload: CostFormValue) => void;
};

const emptyForm: CostFormValue = {
  costNameEn: "",
  costNameAr: "",
  category: "MISCELLANEOUS",
  amount: "",
  date: "",
  notes: "",
};

const toFormValue = (initial?: CostRow | null): CostFormValue => {
  if (!initial) {
    return emptyForm;
  }
  return {
    costNameEn: initial.costNameEn ?? initial.name,
    costNameAr: initial.costNameAr ?? "",
    category: initial.category,
    amount: String(initial.amount),
    date: initial.date,
    notes: initial.notes,
  };
};

export default function CostFormModal({
  open,
  mode,
  initial,
  onClose,
  onSubmit,
}: CostFormModalProps) {
  const { language, t } = useLocalization();
  const text = {
    title: mode === "create" ? (language === "ar" ? "إضافة مصروف" : "Add Cost") : language === "ar" ? "تعديل المصروف" : "Edit Cost",
    amountPlaceholder: language === "ar" ? "المبلغ بالجنيه" : "Amount in EGP",
    notesPlaceholder: language === "ar" ? "ملاحظات" : "Notes",
    cancel: t("common.cancel") || "Cancel",
    addCost: language === "ar" ? "إضافة مصروف" : "Add Cost",
    saveChanges: t("common.saveChanges") || "Save Changes",
  };
  const [form, setForm] = useState<CostFormValue>(() => toFormValue(initial));
  const hookForm = useForm<CostFormValue>({ values: form });

  return (
    <Modal title={text.title} isOpen={open} onClose={onClose}>
      <div className="space-y-4">
        <div onChange={() => setForm((prev) => ({ ...prev, ...hookForm.getValues() }))}>
          <BilingualTextField
            register={hookForm.register}
            nameEnField="costNameEn"
            nameArField="costNameAr"
            label={t("field.costName")}
            requiredEn
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            value={form.category}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, category: event.target.value as CostRow["category"] }))
            }
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            {costCategories.map((category) => (
              <option key={category} value={category}>
                {language === "ar"
                  ? costCategoryArabicLabels[category]
                  : costCategoryLabels[category]}
              </option>
            ))}
          </select>
          <Input
            type="number"
            placeholder={text.amountPlaceholder}
            value={form.amount}
            onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
          />
        </div>
        <Input
          type="date"
          value={form.date}
          onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
          onClick={(event) => event.currentTarget.showPicker?.()}
          className="cursor-pointer"
        />
        <textarea
          value={form.notes}
          onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
          placeholder={text.notesPlaceholder}
          className="min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
        />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            {text.cancel}
          </Button>
          <Button onClick={() => onSubmit(form)}>
            {mode === "create" ? text.addCost : text.saveChanges}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
