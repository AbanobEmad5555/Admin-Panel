import assert from "node:assert/strict";
import test from "node:test";
import {
  eventDateRangeToPayload,
  mapCalendarItemsToEventInputs,
} from "../utils/calendarMappers";

test("maps order and manual events into FullCalendar event inputs", () => {
  const events = mapCalendarItemsToEventInputs(
    [
      {
        id: "ord-1",
        orderId: "ord-1",
        orderNumber: "1234",
        customerName: "Salma Adel",
        orderTotal: 520,
        status: "DELIVERED",
        deliveryDate: "2026-03-04T09:00:00.000Z",
        deliveryEndDate: "2026-03-04T10:00:00.000Z",
      },
    ],
    [
      {
        id: "evt-1",
        title: "Dispatch Review",
        description: "Ops sync",
        startDate: "2026-03-04T10:00:00.000Z",
        endDate: "2026-03-04T11:00:00.000Z",
        color: "#0f766e",
      },
    ],
  );

  assert.equal(events.length, 2);
  assert.equal(events[0]?.id, "order-ord-1");
  assert.equal(events[1]?.id, "manual-evt-1");
  assert.equal(events[0]?.editable, false);
  assert.equal(events[1]?.editable, true);
});

test("converts drag/resize date range to update payload", () => {
  const payload = eventDateRangeToPayload({
    start: new Date("2026-03-04T10:00:00.000Z"),
    end: new Date("2026-03-04T12:30:00.000Z"),
  });

  assert.equal(payload.startDate, "2026-03-04T10:00:00.000Z");
  assert.equal(payload.endDate, "2026-03-04T12:30:00.000Z");
});
