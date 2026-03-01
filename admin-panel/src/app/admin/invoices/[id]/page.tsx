"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AxiosError } from "axios";
import { toast } from "sonner";
import AdminLayout from "@/components/layout/AdminLayout";
import InvoiceActions from "@/app/admin/invoices/components/InvoiceActions";
import InvoiceLineTable from "@/app/admin/invoices/components/InvoiceLineTable";
import InvoiceStatusBadge from "@/app/admin/invoices/components/InvoiceStatusBadge";
import InvoiceTotalsCard from "@/app/admin/invoices/components/InvoiceTotalsCard";
import PaymentTimeline from "@/app/admin/invoices/components/PaymentTimeline";
import {
  useAddInvoicePayment,
  useCancelInvoice,
  useInvoiceDetails,
  usePostInvoice,
  useSendInvoice,
} from "@/app/admin/invoices/hooks/useInvoiceDetails";
import { useRefreshInvoice } from "@/app/admin/invoices/hooks/useRefreshInvoice";
import type { AddInvoicePaymentSchema } from "@/app/admin/invoices/schemas/createInvoice.schema";

type ApiError = {
  message?: string;
};

const toDate = (value?: string | null) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
};

const sourceClass = (source: string) => {
  if (source === "POS_ORDER") return "border-violet-200 bg-violet-50 text-violet-700";
  if (source === "TEMP_ORDER") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-blue-200 bg-blue-50 text-blue-700";
};

const getApiErrorMessage = (error: unknown, fallback: string) => {
  const axiosError = error as AxiosError<ApiError>;
  return axiosError.response?.data?.message ?? fallback;
};

export default function InvoiceDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const details = useInvoiceDetails(id);
  const postInvoice = usePostInvoice();
  const refreshInvoice = useRefreshInvoice();
  const sendInvoice = useSendInvoice();
  const addPayment = useAddInvoicePayment();
  const cancelInvoice = useCancelInvoice();

  const invoice = details.data;

  const onPost = async () => {
    if (!id) return;
    try {
      await postInvoice.mutateAsync(id);
      toast.success("Invoice posted successfully.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to post invoice."));
    }
  };

  const onRefresh = async () => {
    if (!id) return;
    try {
      await refreshInvoice.mutateAsync(id);
      toast.success("Invoice refreshed from source.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to refresh invoice."));
    }
  };

  const onSend = async () => {
    if (!id) return;
    try {
      await sendInvoice.mutateAsync(id);
      toast.success("Invoice sent successfully.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to send invoice."));
    }
  };

  const onAddPayment = async (payload: AddInvoicePaymentSchema) => {
    if (!id) return;
    try {
      await addPayment.mutateAsync({ id, payload });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to add payment."));
      throw error;
    }
  };

  const onCancel = async () => {
    if (!id) return;
    try {
      await cancelInvoice.mutateAsync(id);
      toast.success("Invoice canceled.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to cancel invoice."));
    }
  };

  const handlePrint = () => {
    if (typeof window === "undefined") return;
    window.print();
  };

  return (
    <AdminLayout title="Invoice Details">
      <section className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Invoice Details</h1>
              <p className="text-sm text-slate-500">Full invoice data and actions.</p>
            </div>
            <div className="flex items-center gap-2 print:hidden">
              <button
                type="button"
                onClick={handlePrint}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Print Invoice
              </button>
              <Link href="/admin/invoices" className="text-sm font-medium text-violet-700 hover:underline">
                Back to list
              </Link>
            </div>
          </div>
        </div>

        {details.isLoading ? (
          <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="h-8 animate-pulse rounded bg-slate-200" />
            <div className="h-8 animate-pulse rounded bg-slate-200" />
            <div className="h-8 animate-pulse rounded bg-slate-200" />
          </div>
        ) : null}

        {details.isError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 shadow-sm">
            Failed to load invoice details.
          </div>
        ) : null}

        {invoice ? (
          <>
            <div className="print:hidden">
              <InvoiceActions
                invoice={invoice}
                posting={postInvoice.isPending}
                refreshing={refreshInvoice.isPending}
                sending={sendInvoice.isPending}
                paying={addPayment.isPending}
                canceling={cancelInvoice.isPending}
                onPost={onPost}
                onRefresh={onRefresh}
                onSend={onSend}
                onAddPayment={onAddPayment}
                onCancel={onCancel}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs text-slate-500">Invoice Number</p>
                      <h2 className="text-lg font-semibold text-slate-900">{invoice.invoiceNumber}</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <InvoiceStatusBadge status={invoice.status} />
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${sourceClass(invoice.source)}`}>
                        {invoice.source}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-700 md:grid-cols-2">
                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">Customer</p>
                      <p className="mt-1 font-medium text-slate-900">{invoice.customerName || "Walk-in Customer"}</p>
                      <p className="mt-1 text-xs text-slate-600">Email: {invoice.customerEmail || "-"}</p>
                      <p className="text-xs text-slate-600">Mobile: {invoice.customerMobile || "-"}</p>
                    </div>
                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">Dates</p>
                      <p className="mt-1 text-xs text-slate-600">Issue Date: {toDate(invoice.issueDate)}</p>
                      <p className="text-xs text-slate-600">Due Date: {toDate(invoice.dueDate)}</p>
                      <p className="text-xs text-slate-600">Source Order ID: {invoice.sourceOrderId || "-"}</p>
                    </div>
                  </div>
                </div>

                <InvoiceLineTable lines={invoice.lines} />
                <PaymentTimeline payments={invoice.payments} />

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm print:hidden">
                  <h3 className="text-sm font-semibold text-slate-900">Email Status</h3>
                  <div className="mt-2 grid grid-cols-1 gap-2 text-sm text-slate-700 md:grid-cols-2">
                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">Sent At</p>
                      <p className="mt-1 font-medium text-slate-900">{toDate(invoice.sentAt)}</p>
                    </div>
                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">Email Status</p>
                      <p className="mt-1 font-medium text-slate-900">{invoice.emailStatus || "-"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <InvoiceTotalsCard invoice={invoice} />
              </div>
            </div>
          </>
        ) : null}
      </section>
    </AdminLayout>
  );
}
