import assert from "node:assert/strict";
import test from "node:test";
import {
  mapOrderToCalendarEventInput,
  mapCalendarEventsResponse,
  mapCalendarOrdersResponse,
  normalizeOrderStatus,
  normalizeDeliverySettings,
} from "../utils/calendarMappers";

test("maps calendar orders from success envelope", () => {
  const mapped = mapCalendarOrdersResponse({
    success: true,
    data: {
      orders: [
        {
          id: 77,
          orderNumber: 1209,
          customerName: "Aya Samir",
          totalAmount: "349.99",
          status: "OUT_FOR_DELIVERY",
          deliveryDate: "2026-03-04T09:00:00.000Z",
        },
      ],
    },
  });

  assert.equal(mapped.length, 1);
  assert.equal(mapped[0]?.orderId, "77");
  assert.equal(mapped[0]?.orderNumber, "1209");
  assert.equal(mapped[0]?.status, "OUT_FOR_DELIVERY");
  assert.equal(mapped[0]?.orderTotal, 349.99);
});

test("maps calendar manual events from array payload", () => {
  const mapped = mapCalendarEventsResponse([
    {
      id: "ev-1",
      title: "Courier standup",
      startDate: "2026-03-05T08:00:00.000Z",
      endDate: "2026-03-05T08:30:00.000Z",
      color: "#2563eb",
    },
  ]);

  assert.equal(mapped.length, 1);
  assert.equal(mapped[0]?.id, "ev-1");
  assert.equal(mapped[0]?.title, "Courier standup");
  assert.equal(mapped[0]?.color, "#2563eb");
});

test("normalizes delivery settings from snake_case payload", () => {
  const settings = normalizeDeliverySettings({
    default_delivery_method: "express",
    standard: {
      delivery_days: 4,
      delivery_cost: 40,
    },
    express: {
      delivery_days: 1,
      delivery_cost: 75,
    },
  });

  assert.equal(settings.defaultDeliveryMethod, "EXPRESS");
  assert.equal(settings.STANDARD.deliveryDays, 4);
  assert.equal(settings.EXPRESS.deliveryCost, 75);
});

test("normalizes delivery settings from flat payload shape", () => {
  const settings = normalizeDeliverySettings({
    default_delivery_method: "STANDARD",
    standard_delivery_days: 7,
    standard_delivery_cost: 30,
    express_delivery_days: 2,
    express_delivery_cost: 80,
  });

  assert.equal(settings.defaultDeliveryMethod, "STANDARD");
  assert.equal(settings.STANDARD.deliveryDays, 7);
  assert.equal(settings.STANDARD.deliveryCost, 30);
  assert.equal(settings.EXPRESS.deliveryDays, 2);
  assert.equal(settings.EXPRESS.deliveryCost, 80);
});

test("normalizes delivery settings from nested settings node with snake_case method", () => {
  const settings = normalizeDeliverySettings({
    settings: {
      default_delivery_method: "EXPRESS",
      standard: {
        delivery_days: 6,
        delivery_cost: 25,
      },
      express: {
        delivery_days: 2,
        delivery_cost: 60,
      },
    },
  });

  assert.equal(settings.defaultDeliveryMethod, "EXPRESS");
  assert.equal(settings.STANDARD.deliveryDays, 6);
  assert.equal(settings.STANDARD.deliveryCost, 25);
  assert.equal(settings.EXPRESS.deliveryDays, 2);
  assert.equal(settings.EXPRESS.deliveryCost, 60);
});

test("normalizes delivery settings from methods node shape", () => {
  const settings = normalizeDeliverySettings({
    defaultDeliveryMethod: "STANDARD",
    methods: {
      STANDARD: {
        deliveryDays: 30,
        deliveryCost: 50,
      },
      EXPRESS: {
        deliveryDays: 10,
        deliveryCost: 25,
      },
    },
  });

  assert.equal(settings.defaultDeliveryMethod, "STANDARD");
  assert.equal(settings.STANDARD.deliveryDays, 30);
  assert.equal(settings.STANDARD.deliveryCost, 50);
  assert.equal(settings.EXPRESS.deliveryDays, 10);
  assert.equal(settings.EXPRESS.deliveryCost, 25);
});

test("normalizes order status aliases with spaces and american spelling", () => {
  assert.equal(normalizeOrderStatus("out for delivery"), "OUT_FOR_DELIVERY");
  assert.equal(normalizeOrderStatus("canceled"), "CANCELLED");
});

test("staggeres midnight order delivery events in week view", () => {
  const event = mapOrderToCalendarEventInput({
    id: "4",
    orderId: "4",
    orderNumber: "4",
    customerName: "User",
    orderTotal: 200,
    status: "OUT_FOR_DELIVERY",
    deliveryDate: "2026-03-07T00:00:00.000Z",
    deliveryEndDate: null,
  });

  assert.ok(event);
  assert.notEqual(event.start, "2026-03-07T00:00:00.000Z");
});
