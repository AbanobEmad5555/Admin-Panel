import assert from "node:assert/strict";
import test from "node:test";
import { manualEventSchema } from "../schemas/manualEventSchema";

test("manual event schema accepts valid form input", () => {
  const parsed = manualEventSchema.parse({
    title: "Warehouse freeze window",
    description: "No dispatch between 10:00 and 12:00",
    startDate: "2026-03-04T10:00",
    endDate: "2026-03-04T12:00",
    color: "#0f766e",
  });

  assert.equal(parsed.title, "Warehouse freeze window");
  assert.equal(parsed.color, "#0f766e");
});

test("manual event schema rejects blank title", () => {
  const result = manualEventSchema.safeParse({
    title: " ",
    description: "",
    startDate: "2026-03-04T10:00",
    endDate: "2026-03-04T12:00",
    color: "#0f766e",
  });

  assert.equal(result.success, false);
});

test("manual event schema rejects end date before start date", () => {
  const result = manualEventSchema.safeParse({
    title: "Invalid window",
    description: "",
    startDate: "2026-03-04T12:00",
    endDate: "2026-03-04T10:00",
    color: "#0f766e",
  });

  assert.equal(result.success, false);
});
