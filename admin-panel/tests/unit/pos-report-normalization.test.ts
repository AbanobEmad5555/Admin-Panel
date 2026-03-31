import assert from "node:assert/strict";
import test from "node:test";
import { __testing } from "@/modules/pos/services/pos.service";

test("normalizes session report payload with totalOrders and missing orders array", () => {
  const report = __testing.normalizeSessionReport({
    session: {
      id: "session-1",
    },
    totalSales: 350,
    totalTax: 20,
    totalDiscount: 10,
    totalOrders: 2,
  });

  assert.equal(report.sessionId, "session-1");
  assert.equal(report.totalSales, 350);
  assert.equal(report.totalTax, 20);
  assert.equal(report.totalDiscount, 10);
  assert.equal(report.ordersCount, 2);
  assert.deepEqual(report.orders, []);
  assert.deepEqual(report.paymentBreakdown, []);
});

test("normalizes session report orders when backend returns nested session payload", () => {
  const report = __testing.normalizeSessionReport({
    session: {
      id: "session-2",
      orders: [
        {
          id: "order-1",
          total: 125,
          status: "PAID",
          createdAt: "2026-03-30T00:00:00.000Z",
          items: [{ id: "item-1", quantity: 2, price: 50 }],
        },
      ],
    },
    totalSales: 125,
    totalTax: 0,
    totalDiscount: 0,
  });

  assert.equal(report.sessionId, "session-2");
  assert.equal(report.ordersCount, 1);
  assert.equal(report.orders.length, 1);
  assert.equal(report.orders[0]?.id, "order-1");
  assert.equal(report.orders[0]?.items.length, 1);
});

test("normalizes top products payload fields from backend names", () => {
  const result = __testing.normalizeTopProductsResult({
    page: 1,
    items: [
      {
        productId: 7,
        productName: "Rose Bouquet",
        quantitySold: 5,
        grossSales: 1750,
      },
    ],
  });

  assert.equal(result.page, 1);
  assert.equal(result.totalPages, 1);
  assert.equal(result.totalItems, 1);
  assert.deepEqual(result.items, [
    {
      productId: "7",
      name: "Rose Bouquet",
      qtySold: 5,
      revenue: 1750,
    },
  ]);
});

test("preserves explicit pagination metadata in top products payload", () => {
  const result = __testing.normalizeTopProductsResult({
    items: [],
    pagination: {
      page: 2,
      limit: 20,
      totalItems: 41,
      totalPages: 3,
    },
  });

  assert.equal(result.page, 2);
  assert.equal(result.totalPages, 3);
  assert.equal(result.totalItems, 41);
});
