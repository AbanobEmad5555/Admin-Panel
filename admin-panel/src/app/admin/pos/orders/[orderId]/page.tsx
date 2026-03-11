"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import POSLayout from "@/modules/pos/components/POSLayout";
import { usePosOrderDetails } from "@/modules/pos/hooks/useOrder";
import { usePosProducts } from "@/modules/pos/hooks/useProducts";
import api from "@/services/api";
import { formatEGP } from "@/lib/currency";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

type UnknownRecord = Record<string, unknown>;

const toCurrency = (value: unknown) => {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? formatEGP(parsed) : "-";
};

const toText = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const toDateText = (value: unknown) => {
  if (!value) return "-";
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString();
};

const getFirstImageFromUnknown = (value: unknown): string => {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) {
    for (const entry of value) {
      const candidate = getFirstImageFromUnknown(entry);
      if (candidate) return candidate;
    }
    return "";
  }
  if (typeof value === "object") {
    const record = value as UnknownRecord;
    return (
      (typeof record.url === "string" ? record.url : "") ||
      (typeof record.imageUrl === "string" ? record.imageUrl : "") ||
      (typeof record.image === "string" ? record.image : "") ||
      ""
    );
  }
  return "";
};

const resolveItemName = (
  item: UnknownRecord,
  productMap: Map<string, { name: string; imageUrl?: string }>,
) => {
  const productId = item.productId ? String(item.productId) : "";
  const mappedName = productId ? productMap.get(productId)?.name : "";
  return toText(
    mappedName ??
      item.name ??
      item.productName ??
      item.title ??
      (item.product as UnknownRecord | undefined)?.name,
  );
};

const resolveItemImage = (
  item: UnknownRecord,
  productMap: Map<string, { name: string; imageUrl?: string }>,
) => {
  const productId = item.productId ? String(item.productId) : "";
  const mappedImage = productId ? productMap.get(productId)?.imageUrl : "";

  return (
    mappedImage ||
    getFirstImageFromUnknown(
      item.imageUrl ??
        item.image ??
        item.images ??
        item.productImage ??
        (item.product as UnknownRecord | undefined)?.imageUrl ??
        (item.product as UnknownRecord | undefined)?.image ??
        (item.product as UnknownRecord | undefined)?.images,
    )
  );
};

function DetailField({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 break-all text-sm font-medium text-slate-900">{toText(value)}</p>
    </div>
  );
}

export default function PosOrderDetailsPage() {
  const { language } = useLocalization();
  const router = useRouter();
  const params = useParams<{ orderId: string }>();
  const orderId = params?.orderId;
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const { data, isLoading, isError } = usePosOrderDetails(orderId);
  const { data: products = [] } = usePosProducts();

  const order = (data ?? {}) as UnknownRecord;
  const items = Array.isArray(order.items) ? (order.items as UnknownRecord[]) : [];
  const payments = Array.isArray(order.payments) ? (order.payments as UnknownRecord[]) : [];
  const productMap = new Map(
    products.map((product) => [
      String(product.id),
      { name: product.name, imageUrl: product.imageUrl },
    ]),
  );

  const knownKeys = new Set([
    "id",
    "tempOrderId",
    "sessionId",
    "status",
    "paymentStatus",
    "createdAt",
    "updatedAt",
    "refundedAt",
    "refundReason",
    "customerId",
    "customerName",
    "customerMobileNumber",
    "note",
    "loyaltyProgramCode",
    "subtotal",
    "taxAmount",
    "discountAmount",
    "total",
    "paidAmount",
    "dueAmount",
    "change",
    "items",
    "payments",
  ]);

  const additionalFields = Object.entries(order).filter(
    ([key, value]) => !knownKeys.has(key) && !Array.isArray(value) && typeof value !== "object",
  );
  const text =
    language === "ar"
      ? {
          yes: "نعم",
          no: "لا",
          generateInvoiceSuccess: "تم إنشاء الفاتورة بنجاح.",
          generateInvoiceFailed: "فشل إنشاء فاتورة من طلب نقطة البيع.",
          title: "تفاصيل طلب نقطة البيع",
          description: "تفاصيل الطلب الكاملة من نقطة البيع.",
          posOrderId: "رقم طلب نقطة البيع",
          generating: "جارٍ الإنشاء...",
          generateInvoice: "إنشاء فاتورة",
          backToDailyReport: "العودة إلى التقرير اليومي",
          loading: "جارٍ تحميل تفاصيل الطلب...",
          loadFailed: "فشل تحميل تفاصيل طلب نقطة البيع.",
          status: "الحالة",
          paymentStatus: "حالة الدفع",
          total: "الإجمالي",
          createdAt: "تاريخ الإنشاء",
          orderOverview: "نظرة عامة على الطلب",
          tempOrderId: "رقم الطلب المؤقت",
          sessionId: "رقم الجلسة",
          updatedAt: "تاريخ التحديث",
          refundedAt: "تاريخ الاسترداد",
          refundReason: "سبب الاسترداد",
          customer: "العميل",
          customerId: "رقم العميل",
          customerName: "اسم العميل",
          customerMobile: "هاتف العميل",
          loyaltyProgramCode: "رمز برنامج الولاء",
          note: "ملاحظة",
          financials: "البيانات المالية",
          subtotal: "الإجمالي الفرعي",
          taxAmount: "قيمة الضريبة",
          discountAmount: "قيمة الخصم",
          paidAmount: "المبلغ المدفوع",
          dueAmount: "المبلغ المستحق",
          change: "الباقي",
          items: "العناصر",
          noItems: "لا توجد عناصر.",
          itemImage: "صورة العنصر",
          itemName: "اسم العنصر",
          itemId: "رقم العنصر",
          productId: "رقم المنتج",
          variantId: "رقم المتغير",
          quantity: "الكمية",
          price: "السعر",
          discount: "الخصم",
          tax: "الضريبة",
          noImage: "لا صورة",
          payments: "المدفوعات",
          noPayments: "لا توجد سجلات مدفوعات.",
          method: "الطريقة",
          amount: "المبلغ",
          reference: "المرجع",
          additionalFields: "حقول إضافية",
        }
      : {
          yes: "Yes",
          no: "No",
          generateInvoiceSuccess: "Invoice generated successfully.",
          generateInvoiceFailed: "Failed to generate invoice from POS order.",
          title: "POS Order Details",
          description: "Full order details from POS endpoint.",
          posOrderId: "POS Order ID",
          generating: "Generating...",
          generateInvoice: "Generate Invoice",
          backToDailyReport: "Back to Daily Report",
          loading: "Loading order details...",
          loadFailed: "Failed to load POS order details.",
          status: "Status",
          paymentStatus: "Payment Status",
          total: "Total",
          createdAt: "Created At",
          orderOverview: "Order Overview",
          tempOrderId: "Temp Order ID",
          sessionId: "Session ID",
          updatedAt: "Updated At",
          refundedAt: "Refunded At",
          refundReason: "Refund Reason",
          customer: "Customer",
          customerId: "Customer ID",
          customerName: "Customer Name",
          customerMobile: "Customer Mobile",
          loyaltyProgramCode: "Loyalty Program Code",
          note: "Note",
          financials: "Financials",
          subtotal: "Subtotal",
          taxAmount: "Tax Amount",
          discountAmount: "Discount Amount",
          paidAmount: "Paid Amount",
          dueAmount: "Due Amount",
          change: "Change",
          items: "Items",
          noItems: "No items found.",
          itemImage: "Item Image",
          itemName: "Item Name",
          itemId: "Item ID",
          productId: "Product ID",
          variantId: "Variant ID",
          quantity: "Qty",
          price: "Price",
          discount: "Discount",
          tax: "Tax",
          noImage: "No image",
          payments: "Payments",
          noPayments: "No payment records returned.",
          method: "Method",
          amount: "Amount",
          reference: "Reference",
          additionalFields: "Additional Fields",
        };

  const handleGenerateInvoice = async () => {
    if (!orderId || isGeneratingInvoice) return;
    setIsGeneratingInvoice(true);
    try {
      const response = await api.post("/api/pos/invoices/from-pos-order", {
        orderId,
        postNow: true,
      });
      const payload = (response.data?.data ?? response.data ?? {}) as Record<string, unknown>;
      const invoiceId = String(payload.id ?? payload.invoiceId ?? payload.invoice?.id ?? "");
      toast.success(text.generateInvoiceSuccess);
      if (invoiceId) {
        router.push(`/admin/invoices/${invoiceId}`);
      }
    } catch (error) {
      const errorPayload = (error as { response?: { status?: number; data?: { message?: string; data?: { id?: string; invoiceId?: string } } } }).response;
      const message =
        errorPayload?.data?.message ??
        text.generateInvoiceFailed;
      const existingInvoiceId = errorPayload?.data?.data?.id ?? errorPayload?.data?.data?.invoiceId;
      toast.error(message);
      if (errorPayload?.status === 409 && existingInvoiceId) {
        router.push(`/admin/invoices/${existingInvoiceId}`);
      }
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  return (
    <POSLayout
      title={text.title}
      description={text.description}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-700">
          {text.posOrderId}: <span className="font-semibold">{orderId}</span>
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void handleGenerateInvoice()}
            disabled={isGeneratingInvoice}
            className="rounded-md bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGeneratingInvoice ? text.generating : text.generateInvoice}
          </button>
          <Link
            href="/admin/pos/daily-report"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            {text.backToDailyReport}
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-xl bg-white p-6 text-sm text-slate-500 shadow-sm">{text.loading}</div>
      ) : null}
      {isError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-sm">
          {text.loadFailed}
        </div>
      ) : null}

      {data ? (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500">{text.status}</p>
              <p className="text-base font-semibold text-slate-900">{toText(order.status)}</p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500">{text.paymentStatus}</p>
              <p className="text-base font-semibold text-slate-900">{toText(order.paymentStatus)}</p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500">{text.total}</p>
              <p className="text-base font-semibold text-slate-900">{toCurrency(order.total)}</p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500">{text.createdAt}</p>
              <p className="text-base font-semibold text-slate-900">{toDateText(order.createdAt)}</p>
            </div>
          </div>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">{text.orderOverview}</h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <DetailField label={text.posOrderId} value={order.id} />
              <DetailField label={text.tempOrderId} value={order.tempOrderId} />
              <DetailField label={text.sessionId} value={order.sessionId} />
              <DetailField label={text.status} value={order.status} />
              <DetailField label={text.paymentStatus} value={order.paymentStatus} />
              <DetailField label={text.createdAt} value={toDateText(order.createdAt)} />
              <DetailField label={text.updatedAt} value={toDateText(order.updatedAt)} />
              <DetailField label={text.refundedAt} value={toDateText(order.refundedAt)} />
              <DetailField label={text.refundReason} value={order.refundReason} />
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">{text.customer}</h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <DetailField label={text.customerId} value={order.customerId} />
              <DetailField label={text.customerName} value={order.customerName} />
              <DetailField label={text.customerMobile} value={order.customerMobileNumber} />
              <DetailField label={text.loyaltyProgramCode} value={order.loyaltyProgramCode} />
              <DetailField label={text.note} value={order.note} />
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">{text.financials}</h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <DetailField label={text.subtotal} value={toCurrency(order.subtotal)} />
              <DetailField label={text.taxAmount} value={toCurrency(order.taxAmount)} />
              <DetailField label={text.discountAmount} value={toCurrency(order.discountAmount)} />
              <DetailField label={text.total} value={toCurrency(order.total)} />
              <DetailField label={text.paidAmount} value={toCurrency(order.paidAmount)} />
              <DetailField label={text.dueAmount} value={toCurrency(order.dueAmount)} />
              <DetailField label={text.change} value={toCurrency(order.change)} />
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">{text.items}</h2>
            {items.length === 0 ? (
              <p className="text-sm text-slate-500">{text.noItems}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                      <th className="py-2 pr-3">{text.itemImage}</th>
                      <th className="py-2 pr-3">{text.itemName}</th>
                      <th className="py-2 pr-3">{text.itemId}</th>
                      <th className="py-2 pr-3">{text.productId}</th>
                      <th className="py-2 pr-3">{text.variantId}</th>
                      <th className="py-2 pr-3">{text.quantity}</th>
                      <th className="py-2 pr-3">{text.price}</th>
                      <th className="py-2 pr-3">{text.discount}</th>
                      <th className="py-2 pr-3">{text.tax}</th>
                      <th className="py-2 pr-3">{text.total}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => {
                      const image = resolveItemImage(item, productMap);
                      const name = resolveItemName(item, productMap);
                      return (
                      <tr key={String(item.id ?? `${item.productId}-${item.variantId}`)} className="border-b border-slate-100">
                        <td className="py-2 pr-3">
                          {image ? (
                            <img
                              src={image}
                              alt={String(name)}
                              className="h-10 w-10 rounded-md border border-slate-200 object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-100 text-[10px] text-slate-500">
                              {text.noImage}
                            </div>
                          )}
                        </td>
                        <td className="py-2 pr-3">{name}</td>
                        <td className="py-2 pr-3">{toText(item.id)}</td>
                        <td className="py-2 pr-3">{toText(item.productId)}</td>
                        <td className="py-2 pr-3">{toText(item.variantId)}</td>
                        <td className="py-2 pr-3">{toText(item.quantity)}</td>
                        <td className="py-2 pr-3">{toCurrency(item.price)}</td>
                        <td className="py-2 pr-3">{toCurrency(item.discount)}</td>
                        <td className="py-2 pr-3">{toCurrency(item.tax)}</td>
                        <td className="py-2 pr-3">{toCurrency(item.total)}</td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">{text.payments}</h2>
            {payments.length === 0 ? (
              <p className="text-sm text-slate-500">{text.noPayments}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                      <th className="py-2 pr-3">{text.method}</th>
                      <th className="py-2 pr-3">{text.amount}</th>
                      <th className="py-2 pr-3">{text.reference}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment, index) => (
                      <tr key={String(payment.id ?? `${payment.method}-${index}`)} className="border-b border-slate-100">
                        <td className="py-2 pr-3">{toText(payment.method)}</td>
                        <td className="py-2 pr-3">{toCurrency(payment.amount)}</td>
                        <td className="py-2 pr-3">{toText(payment.reference)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {additionalFields.length > 0 ? (
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-slate-900">{text.additionalFields}</h2>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {additionalFields.map(([key, value]) => (
                  <DetailField key={key} label={key} value={value} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : null}
    </POSLayout>
  );
}
