import assert from "node:assert/strict";
import test from "node:test";
import { canApproveReview, canHideReview } from "@/features/admin-reviews/utils/reviewActions";

test("approve action visibility is correct by status", () => {
  assert.equal(canApproveReview("PENDING"), true);
  assert.equal(canApproveReview("HIDDEN"), true);
  assert.equal(canApproveReview("APPROVED"), false);
});

test("hide action visibility is correct by status", () => {
  assert.equal(canHideReview("APPROVED"), true);
  assert.equal(canHideReview("PENDING"), false);
  assert.equal(canHideReview("HIDDEN"), false);
});

