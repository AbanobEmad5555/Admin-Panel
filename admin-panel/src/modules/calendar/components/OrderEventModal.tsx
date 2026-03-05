"use client";

import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
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
  return (
    <Modal
      title={order ? `Order #${order.orderNumber}` : "Order"}
      isOpen={isOpen}
      onClose={onClose}
    >
      {order ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-2 text-sm text-slate-700">
            <p>
              <span className="font-semibold text-slate-900">Customer:</span> {order.customerName}
            </p>
            <p>
              <span className="font-semibold text-slate-900">Total:</span>{" "}
              {formatCurrency(order.orderTotal)}
            </p>
            <p>
              <span className="font-semibold text-slate-900">Status:</span>{" "}
              {order.status.replace(/_/g, " ")}
            </p>
            <p>
              <span className="font-semibold text-slate-900">Delivery Date:</span>{" "}
              {formatDateTimeLabel(order.deliveryDate)}
            </p>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onEditDeliveryDate}>
              Edit Delivery Date
            </Button>
            <Button type="button" onClick={onOpenOrder}>
              Open Order
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

