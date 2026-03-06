import assert from "node:assert/strict";
import test from "node:test";
import { __testing } from "@/features/purchases/api/purchases.api";

test("normalizePurchase maps backend purchase fields without mock fallbacks", () => {
  const purchase = __testing.normalizePurchase({
    id: 17,
    purchaseId: "PO-17",
    productId: 9,
    productName: "Classic Hoodie - Black / L",
    categoryId: 4,
    categoryName: "Hoodies",
    variantId: 12,
    variantName: "Black / L",
    supplierName: "Acme Textiles",
    supplierContact: "Ahmed",
    supplierEmail: "acme@example.com",
    supplierPhone: "+20123456789",
    quantity: 8,
    unitCost: 1250,
    totalCost: 10000,
    status: "DELIVERED",
    expectedArrivalDate: "2026-03-06",
    deliveredAt: "2026-03-06T09:00:00.000Z",
    pendingApproval: false,
    inventorySyncedAt: "2026-03-06T09:01:00.000Z",
    inventorySyncedQuantity: 8,
    createdAt: "2026-03-01T10:00:00.000Z",
    updatedAt: "2026-03-06T09:01:00.000Z",
  });

  assert.deepEqual(purchase, {
    id: "17",
    purchaseId: "PO-17",
    productId: 9,
    productName: "Classic Hoodie - Black / L",
    categoryId: 4,
    categoryName: "Hoodies",
    variantId: 12,
    variantName: "Black / L",
    supplierName: "Acme Textiles",
    supplierContact: "Ahmed",
    supplierEmail: "acme@example.com",
    supplierPhone: "+20123456789",
    quantity: 8,
    unitCost: 1250,
    totalCost: 10000,
    expectedArrivalDate: "2026-03-06",
    deliveredAt: "2026-03-06T09:00:00.000Z",
    pendingApproval: false,
    inventorySyncedAt: "2026-03-06T09:01:00.000Z",
    inventorySyncedQuantity: 8,
    status: "DELIVERED",
    createdAt: "2026-03-01T10:00:00.000Z",
    updatedAt: "2026-03-06T09:01:00.000Z",
  });
});

test("normalizeCost uses backend name field and uppercase enum categories", () => {
  const cost = __testing.normalizeCost({
    id: 5,
    name: "Warehouse Rent",
    category: "RENT",
    amount: 24000,
    date: "2026-03-01",
    notes: "March rent",
    createdAt: "2026-03-01T08:00:00.000Z",
    updatedAt: "2026-03-01T08:00:00.000Z",
  });

  assert.deepEqual(cost, {
    id: "5",
    name: "Warehouse Rent",
    category: "RENT",
    amount: 24000,
    date: "2026-03-01",
    notes: "March rent",
    createdAt: "2026-03-01T08:00:00.000Z",
    updatedAt: "2026-03-01T08:00:00.000Z",
  });
});

test("normalizeSummary preserves backend totals and bucket payloads", () => {
  const summary = __testing.normalizeSummary({
    totalPurchases: 10000,
    totalOperationalCosts: 3000,
    totalExpenses: 13000,
    revenue: 18000,
    grossProfit: 8000,
    netProfit: 5000,
    avgPurchaseCost: 5000,
    totalOrders: 4,
    purchasesByBucket: { "2026-03-05": 4000, "2026-03-06": 6000 },
    operationalCostsByBucket: [
      { key: "2026-03-05", value: 1000 },
      { key: "2026-03-06", value: 2000 },
    ],
    revenueByBucket: { "2026-03-05": 8000, "2026-03-06": 10000 },
    grossProfitByBucket: { "2026-03-05": 4000, "2026-03-06": 4000 },
    netProfitByBucket: { "2026-03-05": 3000, "2026-03-06": 2000 },
    costBreakdownByCategory: { RENT: 2000, SHIPPING: 1000 },
  });

  assert.equal(summary.totalExpenses, 13000);
  assert.equal(summary.revenue, 18000);
  assert.equal(summary.totalOrders, 4);
  assert.deepEqual(summary.operationalCostsByBucket, {
    "2026-03-05": 1000,
    "2026-03-06": 2000,
  });
  assert.deepEqual(summary.costBreakdownByCategory, {
    RENT: 2000,
    SHIPPING: 1000,
  });
});
