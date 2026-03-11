"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import {
  statusChangeSchema,
  type StatusChangeValues,
} from "@/features/team/schemas/employee.schema";
import type { TeamStatus } from "@/features/team/types";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

type StatusChangeModalProps = {
  open: boolean;
  currentStatus?: TeamStatus;
  pending?: boolean;
  onClose: () => void;
  onSubmit: (values: StatusChangeValues) => void;
};

export default function StatusChangeModal({
  open,
  currentStatus = "ACTIVE",
  pending = false,
  onClose,
  onSubmit,
}: StatusChangeModalProps) {
  const { language } = useLocalization();
  const form = useForm<StatusChangeValues>({
    resolver: zodResolver(statusChangeSchema),
    defaultValues: {
      status: currentStatus,
      reason: "",
    },
  });

  const selectedStatus = form.watch("status");
  const reasonRequired = selectedStatus === "SUSPENDED" || selectedStatus === "TERMINATED";

  return (
    <Modal title={language === "ar" ? "تغيير حالة الموظف" : "Change Employee Status"} isOpen={open} onClose={onClose}>
      <form className="space-y-4 text-slate-950" onSubmit={form.handleSubmit(onSubmit)}>
        <div>
          <label className="text-sm font-medium text-slate-950">{language === "ar" ? "الحالة" : "Status"}</label>
          <select
            {...form.register("status")}
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950"
          >
            <option value="ACTIVE">{language === "ar" ? "نشط" : "ACTIVE"}</option>
            <option value="SUSPENDED">{language === "ar" ? "موقوف" : "SUSPENDED"}</option>
            <option value="VACATION">{language === "ar" ? "إجازة" : "VACATION"}</option>
            <option value="TERMINATED">{language === "ar" ? "منتهي" : "TERMINATED"}</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-950">
            {language === "ar"
              ? `السبب ${reasonRequired ? "*" : "(اختياري)"}`
              : `Reason ${reasonRequired ? "*" : "(optional)"}`}
          </label>
          <textarea
            {...form.register("reason")}
            className="mt-1 min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 placeholder:text-slate-500"
          />
          <p className="mt-1 text-xs text-rose-600">{form.formState.errors.reason?.message}</p>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
            {language === "ar" ? "إلغاء" : "Cancel"}
          </Button>
          <Button type="submit" disabled={pending}>
            {pending
              ? language === "ar"
                ? "جارٍ الحفظ..."
                : "Saving..."
              : language === "ar"
                ? "حفظ الحالة"
                : "Save Status"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
