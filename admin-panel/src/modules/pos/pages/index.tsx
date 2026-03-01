"use client";

import { useEffect, useMemo, useState } from "react";
import type { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import CartPanel from "@/modules/pos/components/CartPanel";
import CategoryTabs from "@/modules/pos/components/CategoryTabs";
import CloseSessionModal from "@/modules/pos/components/CloseSessionModal";
import PaymentModal from "@/modules/pos/components/PaymentModal";
import POSLayout from "@/modules/pos/components/POSLayout";
import ProductGrid from "@/modules/pos/components/ProductGrid";
import ReceiptModal from "@/modules/pos/components/ReceiptModal";
import RefundModal from "@/modules/pos/components/RefundModal";
import SessionModal from "@/modules/pos/components/SessionModal";
import { useCreateOrder, useRefundOrder } from "@/modules/pos/hooks/useOrder";
import { usePayOrder } from "@/modules/pos/hooks/usePayment";
import { usePosProducts } from "@/modules/pos/hooks/useProducts";
import { useCloseSession, useCurrentSession, useOpenSession } from "@/modules/pos/hooks/useSession";
import { posService } from "@/modules/pos/services/pos.service";
import { usePosStore } from "@/modules/pos/store/pos.store";
import type { PosOrder } from "@/modules/pos/types";
import { getAdminToken } from "@/lib/auth";
import { formatEGP } from "@/lib/currency";
import api from "@/services/api";

type OrderSummary = Pick<
  PosOrder,
  "id" | "status" | "paymentStatus" | "total" | "paidAmount" | "dueAmount" | "change" | "tempOrderId"
>;
type ReceiptBrandInfo = {
  websiteName: string;
  logoUrl: string;
};

const getApiMessage = (error: unknown): string | null => {
  if (!error || typeof error !== "object") {
    return null;
  }

  const axiosError = error as AxiosError<{ message?: string }>;
  const status = axiosError.response?.status;
  const message = axiosError.response?.data?.message;
  const normalizedMessage = typeof message === "string" ? message.toLowerCase() : "";

  if (
    normalizedMessage.includes("insufficient stock") ||
    normalizedMessage.includes("out of stock")
  ) {
    return "This item currently out of stock";
  }

  if (status === 403 && typeof message === "string" && message.trim()) {
    return message;
  }

  return null;
};

const getRoleFromToken = () => {
  const token = getAdminToken();
  if (!token) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const payload = JSON.parse(atob(padded));
    const role = payload?.role ?? payload?.userRole ?? payload?.data?.role;
    return typeof role === "string" ? role.toUpperCase() : null;
  } catch {
    return null;
  }
};

export default function PosTerminalPage() {
  const router = useRouter();
  const store = usePosStore();
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [closeSessionOpen, setCloseSessionOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState<PosOrder | null>(null);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [latestOrder, setLatestOrder] = useState<OrderSummary | null>(null);
  const [receiptBrandInfo, setReceiptBrandInfo] = useState<ReceiptBrandInfo>({
    websiteName: "Admin Panel",
    logoUrl: "",
  });

  const { data: currentSession, isLoading } = useCurrentSession();
  const { data: products = [], isLoading: productsLoading, isError: productsError } = usePosProducts();
  const openSession = useOpenSession();
  const closeSession = useCloseSession();
  const createOrder = useCreateOrder();
  const payOrder = usePayOrder();
  const refundOrder = useRefundOrder();
  const role = useMemo(() => getRoleFromToken(), []);
  const canRefund = role === "ADMIN" || role === "SUPERVISOR";

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(products.map((product) => product.category)))],
    [products]
  );

  const filteredProducts = useMemo(() => {
    if (store.activeCategory === "All") {
      return products;
    }
    return products.filter((product) => product.category === store.activeCategory);
  }, [products, store.activeCategory]);
  const productNameById = useMemo(
    () =>
      new Map(
        products.map((product) => [String(product.id), String(product.name ?? "").trim()])
      ),
    [products]
  );

  useEffect(() => {
    let isMounted = true;

    const loadReceiptBrandInfo = async () => {
      try {
        const [footerRes, homepageRes] = await Promise.allSettled([
          api.get<{ data?: { websiteName?: string | null } }>("/footer-settings"),
          api.get<{ data?: { logoUrl?: string | null } }>("/homepage-control"),
        ]);

        if (!isMounted) {
          return;
        }

        const websiteName =
          footerRes.status === "fulfilled"
            ? String(footerRes.value.data?.data?.websiteName ?? "").trim()
            : "";
        const logoUrl =
          homepageRes.status === "fulfilled"
            ? String(homepageRes.value.data?.data?.logoUrl ?? "").trim()
            : "";

        setReceiptBrandInfo({
          websiteName: websiteName || "Admin Panel",
          logoUrl,
        });
      } catch {
        if (!isMounted) {
          return;
        }
        setReceiptBrandInfo({
          websiteName: "Admin Panel",
          logoUrl: "",
        });
      }
    };

    void loadReceiptBrandInfo();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddProduct = (product: (typeof products)[number]) => {
    if ((product.stock ?? 0) <= 0) {
      toast.error("This item currently out of stock");
      return;
    }
    store.addProduct(product);
  };

  const handleConfirmPayment = async (
    payments: Array<{ method: "CASH" | "CARD" | "WALLET"; amount: number; reference?: string }>
  ) => {
    if (!currentSession?.id) {
      toast.error("Open a session first.");
      return;
    }

    if (store.items.length === 0) {
      toast.error("Cart is empty.");
      return;
    }

    try {
      const created = await createOrder.mutateAsync({
        sessionId: currentSession.id,
        customerName: store.customerName.trim() || undefined,
        customerMobileNumber: store.customerMobileNumber.trim() || undefined,
        note: store.note.trim() || undefined,
        loyaltyProgramCode: store.loyaltyProgramCode.trim() || undefined,
        items: store.items,
        payments,
        discountAmount: store.discount,
        taxAmount: store.tax,
      });
      setLatestOrder({
        id: created.id,
        status: created.status,
        paymentStatus: created.paymentStatus,
        total: created.total,
        paidAmount: created.paidAmount,
        dueAmount: created.dueAmount,
        change: created.change,
        tempOrderId: created.tempOrderId ?? null,
      });
      toast.success(
        `Order created. POS Order: ${created.id}, Temp Order: ${created.tempOrderId ?? "-"}`
      );

      const paymentStatus = String(created.paymentStatus ?? "").toUpperCase();
      const isAlreadyPaid = paymentStatus === "PAID" || Number(created.dueAmount ?? 0) <= 0;

      let finalizedOrder = created;
      if (!isAlreadyPaid) {
        await payOrder.mutateAsync({
          orderId: created.id,
          payload: { payments },
        });
        finalizedOrder = await posService.getOrderById(created.id);
      }

      setReceiptOrder(finalizedOrder);
      setLatestOrder({
        id: finalizedOrder.id,
        status: finalizedOrder.status,
        paymentStatus: finalizedOrder.paymentStatus,
        total: finalizedOrder.total,
        paidAmount: finalizedOrder.paidAmount,
        dueAmount: finalizedOrder.dueAmount,
        change: finalizedOrder.change,
        tempOrderId: finalizedOrder.tempOrderId ?? created.tempOrderId ?? null,
      });
      setPaymentOpen(false);
      setReceiptOpen(true);
      store.clearCart();
      toast.success("Payment completed.");
    } catch (error) {
      const apiMessage = getApiMessage(error);
      if (apiMessage) {
        toast.error(apiMessage);
        return;
      }
      toast.error("Failed to process payment.");
    }
  };

  const copyValue = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied.");
    } catch {
      toast.error("Failed to copy.");
    }
  };

  const handleGenerateInvoice = async () => {
    if (!receiptOrder?.id || isGeneratingInvoice) {
      return;
    }

    setIsGeneratingInvoice(true);
    try {
      const response = await api.post("/api/pos/invoices/from-pos-order", {
        orderId: receiptOrder.id,
        postNow: true,
      });
      const payload = (response.data?.data ?? response.data ?? {}) as Record<string, unknown>;
      const invoiceId = String(payload.id ?? payload.invoiceId ?? payload.invoice?.id ?? "");
      toast.success("Invoice generated successfully.");
      if (invoiceId) {
        setReceiptOpen(false);
        router.push(`/admin/invoices/${invoiceId}`);
      }
    } catch (error) {
      const response = (error as { response?: { status?: number; data?: { message?: string; data?: { id?: string; invoiceId?: string } } } }).response;
      const message =
        response?.data?.message ?? "Failed to generate invoice from POS order.";
      const existingInvoiceId = response?.data?.data?.id ?? response?.data?.data?.invoiceId;
      toast.error(message);
      if (response?.status === 409 && existingInvoiceId) {
        setReceiptOpen(false);
        router.push(`/admin/invoices/${existingInvoiceId}`);
      }
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  const handlePrintInvoice = () => {
    if (typeof window === "undefined" || !receiptOrder) {
      return;
    }

    void (async () => {
      const escapeHtml = (value: string) =>
        value
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");

      const isGenericItemName = (value: string) => /^item(\s*#\S+)?$/i.test(value.trim());

      const backendNameByItemIndex = new Map<number, string>();
      const backendNameByProductId = new Map<string, string>();

      try {
        const rawOrder = await posService.getPosOrderRaw(receiptOrder.id);
        const rawItems = Array.isArray(rawOrder?.items) ? rawOrder.items : [];
        rawItems.forEach((rawItem, index) => {
          const line = (rawItem ?? {}) as Record<string, unknown>;
          const product = (line.product ?? {}) as Record<string, unknown>;
          const lineName = String(
            line.name ??
              line.productName ??
              line.itemName ??
              product.name ??
              line.description ??
              ""
          ).trim();
          const productId = String(line.productId ?? product.id ?? "").trim();

          if (lineName) {
            backendNameByItemIndex.set(index, lineName);
            if (productId) {
              backendNameByProductId.set(productId, lineName);
            }
          }
        });
      } catch {
        // fallback to locally cached names only
      }

      const itemsMarkup = receiptOrder.items
        .map((item, index) => {
          const productId = String(item.productId ?? "").trim();
          const rawName = String(item.name ?? "").trim();
          const resolvedName =
            (rawName && !isGenericItemName(rawName) ? rawName : "") ||
            backendNameByItemIndex.get(index) ||
            (productId ? backendNameByProductId.get(productId) : undefined) ||
            (productId ? productNameById.get(productId) : undefined) ||
            (productId ? `Item #${productId}` : "Item");
          const name = escapeHtml(resolvedName);
          const quantity = Number(item.qty ?? 0);
          const total = formatEGP(quantity * Number(item.unitPrice ?? 0));
          return `<div class="row"><span>${name} x${quantity}</span><span>${total}</span></div>`;
        })
        .join("");
      const websiteName = escapeHtml(receiptBrandInfo.websiteName || "Admin Panel");
      const logoSrc = receiptBrandInfo.logoUrl.trim();
      const websiteLogoMarkup = logoSrc
        ? `<div class="brand-logo-wrap"><img class="brand-logo" src="${escapeHtml(logoSrc)}" alt="${websiteName}" /></div>`
        : "";

      const html = `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Receipt</title>
    <base href="${window.location.origin}/" />
    <style>
      @page { size: 80mm auto; margin: 0; }
      html, body { width: 80mm; margin: 0; padding: 0; }
      body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; }
      .wrap { width: 72mm; padding: 4mm; }
      .brand-logo-wrap { text-align: left; margin-bottom: 6px; }
      .brand-logo { max-width: 28mm; max-height: 18mm; object-fit: contain; }
      .brand-name { text-align: left; font-size: 16px; font-weight: 700; margin: 0 0 10px 0; }
      h1 { margin: 0 0 8px 0; font-size: 26px; }
      .meta { margin: 0 0 6px 0; font-size: 13px; }
      .section { margin-top: 10px; }
      .row { display: flex; justify-content: space-between; align-items: center; margin: 4px 0; font-size: 13px; }
      .total { font-weight: 700; }
      .footer-note { margin-top: 12px; text-align: left; font-size: 12px; line-height: 1.4; }
    </style>
  </head>
  <body>
    <div class="wrap">
      ${websiteLogoMarkup}
      <p class="brand-name">${websiteName}</p>
      <h1>Receipt</h1>
      <p class="meta"><strong>POS Order:</strong> #${escapeHtml(String(receiptOrder.id))}</p>
      <div class="section">
        ${itemsMarkup}
      </div>
      <div class="section">
        <div class="row"><span>Subtotal</span><span>${formatEGP(receiptOrder.subtotal)}</span></div>
        <div class="row"><span>Tax</span><span>${formatEGP(receiptOrder.tax)}</span></div>
        <div class="row"><span>Discount</span><span>${formatEGP(receiptOrder.discount)}</span></div>
        <div class="row total"><span>Total</span><span>${formatEGP(receiptOrder.total)}</span></div>
      </div>
      <div class="footer-note">
        <div>Thanks for Shoping with us</div>
        <div>Powered by Vibe Clouds solutions</div>
      </div>
    </div>
  </body>
</html>`;

      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      iframe.setAttribute("aria-hidden", "true");
      document.body.appendChild(iframe);

      const cleanup = () => {
        window.setTimeout(() => {
          iframe.remove();
        }, 300);
      };

      const frameWindow = iframe.contentWindow;
      if (!frameWindow) {
        cleanup();
        toast.error("Unable to open print view.");
        return;
      }

      frameWindow.document.open();
      frameWindow.document.write(html);
      frameWindow.document.close();
      frameWindow.focus();
      frameWindow.print();
      cleanup();
    })();
  };

  return (
    <POSLayout
      title="POS Terminal"
      description="Create orders, accept split payments, issue refunds, and close sessions."
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
          {currentSession?.id ? `Session ${currentSession.id}` : "No active session"}
        </span>
        <button
          type="button"
          onClick={() => setCloseSessionOpen(true)}
          disabled={!currentSession?.id}
          className="rounded-md border border-violet-200 bg-white px-3 py-2 text-xs font-semibold text-violet-700 disabled:opacity-40"
        >
          Close Session
        </button>
      </div>
      {latestOrder ? (
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Latest Order Summary</p>
          <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-slate-700 md:grid-cols-2">
            <p className="flex items-center gap-2">
              POS Order ID: <span className="font-semibold">{latestOrder.id}</span>
              <button
                type="button"
                onClick={() => void copyValue(String(latestOrder.id))}
                className="rounded border border-slate-300 px-2 py-0.5 text-[11px]"
              >
                Copy
              </button>
            </p>
            <p className="flex items-center gap-2">
              Temp Order ID:{" "}
              <span className="font-semibold">{latestOrder.tempOrderId ?? "-"}</span>
              {latestOrder.tempOrderId ? (
                <button
                  type="button"
                  onClick={() => void copyValue(String(latestOrder.tempOrderId))}
                  className="rounded border border-slate-300 px-2 py-0.5 text-[11px]"
                >
                  Copy
                </button>
              ) : null}
            </p>
            <p>Status: {latestOrder.status ?? "-"}</p>
            <p>Payment Status: {latestOrder.paymentStatus ?? "-"}</p>
            <p>Total: {formatEGP(Number(latestOrder.total ?? 0))}</p>
            <p>Paid: {formatEGP(Number(latestOrder.paidAmount ?? 0))}</p>
            <p>Due: {formatEGP(Number(latestOrder.dueAmount ?? 0))}</p>
            <p>Change: {formatEGP(Number(latestOrder.change ?? 0))}</p>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
        <CartPanel
          items={store.items}
          subtotal={store.subtotal}
          tax={store.tax}
          discount={store.discount}
          total={store.total}
          customerName={store.customerName}
          customerMobileNumber={store.customerMobileNumber}
          note={store.note}
          loyaltyProgramCode={store.loyaltyProgramCode}
          onQtyChange={store.setQty}
          onRemove={store.removeItem}
          onCustomerNameChange={store.setCustomerName}
          onCustomerMobileNumberChange={store.setCustomerMobileNumber}
          onNoteChange={store.setNote}
          onLoyaltyProgramCodeChange={store.setLoyaltyProgramCode}
          onResetProgram={() => store.setLoyaltyProgramCode("")}
          canRefund={canRefund}
          onOpenRefund={() => setRefundOpen(true)}
          onOpenPayment={() => setPaymentOpen(true)}
        />

        <div className="space-y-4">
          <CategoryTabs
            categories={categories}
            activeCategory={store.activeCategory}
            onChange={store.setActiveCategory}
          />
          {productsLoading ? (
            <div className="rounded-xl bg-white p-6 text-sm text-slate-500 shadow-sm">
              Loading products...
            </div>
          ) : null}
          {productsError ? (
            <div className="rounded-xl bg-rose-50 p-6 text-sm text-rose-700 shadow-sm">
              Failed to load products from backend.
            </div>
          ) : null}
          <ProductGrid products={filteredProducts} onAdd={handleAddProduct} />
        </div>
      </div>

      <SessionModal
        open={!isLoading && !currentSession?.id}
        pending={openSession.isPending}
        onSubmit={async (payload) => {
          try {
            await openSession.mutateAsync(payload);
            toast.success("Session opened.");
          } catch (error) {
            const apiMessage = getApiMessage(error);
            if (apiMessage) {
              toast.error(apiMessage);
              return;
            }
            toast.error("Failed to open session.");
          }
        }}
      />

      <PaymentModal
        open={paymentOpen}
        total={store.total}
        pending={createOrder.isPending || payOrder.isPending}
        onClose={() => setPaymentOpen(false)}
        onSubmit={handleConfirmPayment}
      />

      <RefundModal
        open={refundOpen}
        pending={refundOrder.isPending}
        onClose={() => setRefundOpen(false)}
        onSubmit={async (orderId, payload) => {
          try {
            await refundOrder.mutateAsync({ orderId, payload });
            toast.success("Refund successful.");
            setRefundOpen(false);
          } catch (error) {
            const apiMessage = getApiMessage(error);
            if (apiMessage) {
              toast.error(apiMessage);
              return;
            }
            toast.error("Refund failed.");
          }
        }}
      />

      <CloseSessionModal
        open={closeSessionOpen}
        pending={closeSession.isPending}
        session={currentSession}
        onClose={() => setCloseSessionOpen(false)}
        onSubmit={async (closingBalance) => {
          if (!currentSession?.id) {
            return;
          }
          try {
            await closeSession.mutateAsync({
              sessionId: currentSession.id,
              closingBalance,
            });
            toast.success("Session closed.");
            setCloseSessionOpen(false);
          } catch (error) {
            const apiMessage = getApiMessage(error);
            if (apiMessage) {
              toast.error(apiMessage);
              return;
            }
            toast.error("Failed to close session.");
          }
        }}
      />

      <ReceiptModal
        open={receiptOpen}
        order={receiptOrder}
        generatingInvoice={isGeneratingInvoice}
        onGenerateInvoice={handleGenerateInvoice}
        onPrint={handlePrintInvoice}
        onClose={() => setReceiptOpen(false)}
      />
    </POSLayout>
  );
}
