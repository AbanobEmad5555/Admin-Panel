"use client";

import { useRef } from "react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { useLocalization } from "@/modules/localization/LocalizationProvider";
import type {
  CalendarOrderEventExtendedProps,
  UpdateOrderDeliveryDatePayload,
} from "@/modules/calendar/types/calendar.types";
import { localDateInputToUtcIso, utcIsoToDateInputValue } from "@/modules/calendar/utils/date";

type OrderDeliveryDateModalProps = {
  isOpen: boolean;
  order: CalendarOrderEventExtendedProps | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: UpdateOrderDeliveryDatePayload) => Promise<void>;
};

export default function OrderDeliveryDateModal({
  isOpen,
  order,
  isSubmitting,
  onClose,
  onSubmit,
}: OrderDeliveryDateModalProps) {
  const { language } = useLocalization();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const text =
    language === "ar"
      ? {
          editDeliveryDate: "تعديل موعد التسليم",
          deliveryDate: "موعد التسليم",
          cancel: "إلغاء",
          saving: "جارٍ الحفظ...",
          saveDate: "حفظ الموعد",
          order: "الطلب",
        }
      : {
          editDeliveryDate: "Edit Delivery Date",
          deliveryDate: "Delivery Date",
          cancel: "Cancel",
          saving: "Saving...",
          saveDate: "Save Date",
          order: "Order",
        };

  const openNativePicker = () => {
    if (!inputRef.current) {
      return;
    }
    if (typeof inputRef.current.showPicker === "function") {
      inputRef.current.showPicker();
      return;
    }
    inputRef.current.focus();
  };

  const handleSubmit = async () => {
    const value = inputRef.current?.value ?? "";
    if (!value) {
      return;
    }

    const deliveryDate = localDateInputToUtcIso(value);
    await onSubmit({ deliveryDate: deliveryDate || value });
  };

  return (
    <Modal
      title={
        order
          ? `${text.editDeliveryDate} - ${text.order} #${order.orderNumber}`
          : text.editDeliveryDate
      }
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="block text-sm font-semibold text-slate-900">{text.deliveryDate}</label>
          <input
            key={order?.orderId ?? "delivery-date"}
            ref={inputRef}
            type="date"
            defaultValue={order ? utcIsoToDateInputValue(order.deliveryDate) : ""}
            className="w-full cursor-pointer rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            onClick={openNativePicker}
            onFocus={openNativePicker}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {text.cancel}
          </Button>
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting}
          >
            {isSubmitting ? text.saving : text.saveDate}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
