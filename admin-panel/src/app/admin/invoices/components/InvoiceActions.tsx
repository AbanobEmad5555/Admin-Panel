"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import RefreshFromSourceButton from "@/app/admin/invoices/components/RefreshFromSourceButton";
import { addInvoicePaymentSchema, type AddInvoicePaymentSchema } from "@/app/admin/invoices/schemas/createInvoice.schema";
import type { InvoiceDetails } from "@/app/admin/invoices/services/invoice.types";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

type Props = {
  invoice: InvoiceDetails;
  posting: boolean;
  refreshing: boolean;
  sending: boolean;
  paying: boolean;
  canceling: boolean;
  onPost: () => Promise<void>;
  onRefresh: () => Promise<void>;
  onSend: () => Promise<void>;
  onAddPayment: (payload: AddInvoicePaymentSchema) => Promise<void>;
  onCancel: () => Promise<void>;
};

export default function InvoiceActions({
  invoice,
  posting,
  refreshing,
  sending,
  paying,
  canceling,
  onPost,
  onRefresh,
  onSend,
  onAddPayment,
  onCancel,
}: Props) {
  const { language } = useLocalization();
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const isCanceled = invoice.status === "CANCELED";
  const text =
    language === "ar"
      ? {
          paymentAdded: "تمت إضافة الدفعة بنجاح.",
          posting: "جارٍ ترحيل الفاتورة...",
          postInvoice: "ترحيل الفاتورة",
          sending: "جارٍ إرسال الفاتورة...",
          sendInvoice: "إرسال الفاتورة",
          addPayment: "إضافة دفعة",
          canceling: "جارٍ إلغاء الفاتورة...",
          cancelInvoice: "إلغاء الفاتورة",
          modalTitle: "إضافة دفعة",
          method: "الطريقة",
          amount: "المبلغ",
          reference: "المرجع",
          optionalReference: "مرجع اختياري",
          close: "إغلاق",
          saving: "جارٍ الحفظ...",
          savePayment: "حفظ الدفعة",
        }
      : {
          paymentAdded: "Payment added successfully.",
          posting: "Posting...",
          postInvoice: "Post Invoice",
          sending: "Sending...",
          sendInvoice: "Send Invoice",
          addPayment: "Add Payment",
          canceling: "Canceling...",
          cancelInvoice: "Cancel Invoice",
          modalTitle: "Add Payment",
          method: "Method",
          amount: "Amount",
          reference: "Reference",
          optionalReference: "Optional reference",
          close: "Close",
          saving: "Saving...",
          savePayment: "Save Payment",
        };

  const form = useForm<AddInvoicePaymentSchema>({
    resolver: zodResolver(addInvoicePaymentSchema),
    defaultValues: {
      method: "CASH",
      amount: invoice.remainingAmount > 0 ? invoice.remainingAmount : 0,
      reference: "",
    },
  });

  const disabledAll = useMemo(
    () => isCanceled || posting || refreshing || sending || paying || canceling,
    [isCanceled, posting, refreshing, sending, paying, canceling],
  );

  const submitPayment = form.handleSubmit(async (values) => {
    try {
      await onAddPayment(values);
      toast.success(text.paymentAdded);
      setPaymentModalOpen(false);
      form.reset({
        method: "CASH",
        amount: invoice.remainingAmount > 0 ? invoice.remainingAmount : 0,
        reference: "",
      });
    } catch {
      // Handled by caller.
    }
  });

  return (
    <>
      <div className="sticky top-16 z-20 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {invoice.canPost ? (
            <Button
              type="button"
              onClick={() => void onPost()}
              disabled={disabledAll}
            >
              {posting ? text.posting : text.postInvoice}
            </Button>
          ) : null}

          {invoice.canRefresh ? (
            <RefreshFromSourceButton
              onClick={() => void onRefresh()}
              loading={refreshing}
              disabled={disabledAll}
            />
          ) : null}

          {invoice.canSend ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => void onSend()}
              disabled={disabledAll}
            >
              {sending ? text.sending : text.sendInvoice}
            </Button>
          ) : null}

          {invoice.canAddPayment ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPaymentModalOpen(true)}
              disabled={disabledAll}
            >
              {text.addPayment}
            </Button>
          ) : null}

          {invoice.canCancel ? (
            <Button
              type="button"
              variant="danger"
              onClick={() => void onCancel()}
              disabled={disabledAll}
            >
              {canceling ? text.canceling : text.cancelInvoice}
            </Button>
          ) : null}
        </div>
      </div>

      <Modal
        title={text.modalTitle}
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
      >
        <form className="space-y-3" onSubmit={(event) => void submitPayment(event)}>
          <div>
            <label className="text-xs font-medium text-slate-600">{text.method}</label>
            <select
              {...form.register("method")}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="CASH">CASH</option>
              <option value="CARD">CARD</option>
              <option value="WALLET">WALLET</option>
              <option value="BANK_TRANSFER">BANK_TRANSFER</option>
            </select>
            {form.formState.errors.method ? (
              <p className="mt-1 text-xs text-rose-600">{form.formState.errors.method.message}</p>
            ) : null}
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">{text.amount}</label>
            <input
              type="number"
              step="0.01"
              {...form.register("amount")}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />
            {form.formState.errors.amount ? (
              <p className="mt-1 text-xs text-rose-600">{form.formState.errors.amount.message}</p>
            ) : null}
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">{text.reference}</label>
            <input
              type="text"
              {...form.register("reference")}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              placeholder={text.optionalReference}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setPaymentModalOpen(false)}>
              {text.close}
            </Button>
            <Button type="submit" disabled={paying || form.formState.isSubmitting}>
              {paying || form.formState.isSubmitting ? text.saving : text.savePayment}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

