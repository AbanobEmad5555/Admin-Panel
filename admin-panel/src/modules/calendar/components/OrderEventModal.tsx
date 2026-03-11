"use client";

import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { useLocalization } from "@/modules/localization/LocalizationProvider";
import type { CalendarOrderEventExtendedProps } from "@/modules/calendar/types/calendar.types";
import { formatCurrency, formatDateTimeLabel } from "@/modules/calendar/utils/date";

type OrderEventModalProps = {
  isOpen: boolean;
  order: CalendarOrderEventExtendedProps | null;
  onClose: () => void;
  onOpenOrder: () => void;
  onEditDeliveryDate: () => void;
};

export default function OrderEventModal({
  isOpen,
  order,
  onClose,
  onOpenOrder,
  onEditDeliveryDate,
}: OrderEventModalProps) {
  const { language } = useLocalization();
  const text =
    language === "ar"
      ? {
          order: "الطلب",
          customer: "العميل",
          total: "الإجمالي",
          status: "الحالة",
          deliveryDate: "موعد التسليم",
          editDeliveryDate: "تعديل موعد التسليم",
          openOrder: "فتح الطلب",
        }
      : {
          order: "Order",
          customer: "Customer",
          total: "Total",
          status: "Status",
          deliveryDate: "Delivery Date",
          editDeliveryDate: "Edit Delivery Date",
          openOrder: "Open Order",
        };
  return (
    <Modal
      title={order ? `${text.order} #${order.orderNumber}` : text.order}
      isOpen={isOpen}
      onClose={onClose}
    >
      {order ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-2 text-sm text-slate-700">
            <p>
              <span className="font-semibold text-slate-900">{text.customer}:</span>{" "}
              {order.customerName}
            </p>
            <p>
              <span className="font-semibold text-slate-900">{text.total}:</span>{" "}
              {formatCurrency(order.orderTotal)}
            </p>
            <p>
              <span className="font-semibold text-slate-900">{text.status}:</span>{" "}
              {order.status.replace(/_/g, " ")}
            </p>
            <p>
              <span className="font-semibold text-slate-900">{text.deliveryDate}:</span>{" "}
              {formatDateTimeLabel(order.deliveryDate)}
            </p>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onEditDeliveryDate}>
              {text.editDeliveryDate}
            </Button>
            <Button type="button" onClick={onOpenOrder}>
              {text.openOrder}
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

