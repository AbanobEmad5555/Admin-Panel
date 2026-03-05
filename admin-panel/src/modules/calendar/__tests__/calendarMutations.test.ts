import assert from "node:assert/strict";
import test from "node:test";
import {
  getManualEventMutationInvalidationKeys,
  getOrderDeliveryDateInvalidationKeys,
} from "../hooks/mutationKeys";

test("manual event mutation invalidates month and prefix keys", () => {
  const keys = getManualEventMutationInvalidationKeys("2026-03");

  assert.deepEqual(keys, [
    ["calendar-events", "2026-03"],
    ["calendar-events"],
  ]);
});

test("delivery date mutation invalidates month and prefix order keys", () => {
  const keys = getOrderDeliveryDateInvalidationKeys("2026-03");

  assert.deepEqual(keys, [
    ["calendar-orders", "2026-03"],
    ["calendar-orders"],
  ]);
});
