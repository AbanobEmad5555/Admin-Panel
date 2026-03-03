import assert from "node:assert/strict";
import test from "node:test";
import { getDeleteReviewInvalidationKeys } from "@/features/admin-reviews/hooks/useDeleteReview";
import { getReviewStatusInvalidationKeys } from "@/features/admin-reviews/hooks/useUpdateReviewStatus";

test("status mutation invalidates reviews and product rating queries", () => {
  const keys = getReviewStatusInvalidationKeys("prod-7");

  assert.deepEqual(keys, [
    ["admin-reviews"],
    ["rating-summary", "prod-7"],
    ["product-reviews", "prod-7"],
  ]);
});

test("delete mutation invalidates admin reviews query", () => {
  const keys = getDeleteReviewInvalidationKeys();
  assert.deepEqual(keys, [["admin-reviews"]]);
});

