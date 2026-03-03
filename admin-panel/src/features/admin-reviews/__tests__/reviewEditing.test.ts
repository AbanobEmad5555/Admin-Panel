import assert from "node:assert/strict";
import test from "node:test";
import type { AdminReview } from "@/features/admin-reviews/api/adminReviews.types";
import {
  filterOnlyEditedReviews,
  getReviewStatusPresentation,
  isReviewEdited,
  shouldShowEditedNotice,
  withReviewEditingFlags,
} from "@/features/admin-reviews/utils/reviewEditing";

const baseReview: AdminReview = {
  id: "rev-1",
  rating: 4,
  comment: "Nice",
  status: "PENDING",
  createdAt: "2026-03-01T10:00:00.000Z",
  updatedAt: "2026-03-01T10:00:00.000Z",
  user: {
    id: "u1",
    firstName: "A",
    lastName: "B",
    email: "a@test.com",
    phone: "123",
  },
  product: {
    id: "p1",
    name: "P",
    sku: "SKU-1",
  },
  media: [],
};

test("detects edited review from ISO timestamp difference", () => {
  assert.equal(
    isReviewEdited({
      createdAt: "2026-03-01T10:00:00.000Z",
      updatedAt: "2026-03-01T10:00:00.000Z",
    }),
    false,
  );
  assert.equal(
    isReviewEdited({
      createdAt: "2026-03-01T10:00:00.000Z",
      updatedAt: "2026-03-02T10:00:00.000Z",
    }),
    true,
  );
});

test("shows edited pending badge variant and accessibility label", () => {
  const presentation = getReviewStatusPresentation({
    status: "PENDING",
    isEdited: true,
  });

  assert.equal(presentation.label, "PENDING (Edited)");
  assert.equal(presentation.ariaLabel, "Edited review pending moderation");
});

test("drawer metadata helper shows edited notice only when updatedAt is later", () => {
  assert.equal(
    shouldShowEditedNotice({
      status: "PENDING",
      isEdited: true,
    }),
    true,
  );
  assert.equal(
    shouldShowEditedNotice({
      status: "APPROVED",
      isEdited: true,
    }),
    false,
  );
});

test("filters only edited reviews when onlyEdited flag is enabled", () => {
  const list = withReviewEditingFlags([
    baseReview,
    {
      ...baseReview,
      id: "rev-2",
      updatedAt: "2026-03-03T10:00:00.000Z",
    },
    {
      ...baseReview,
      id: "rev-3",
      status: "APPROVED",
      updatedAt: "2026-03-03T10:00:00.000Z",
    },
  ]);

  const filtered = filterOnlyEditedReviews(list, true);
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0]?.id, "rev-2");
});

test("approve edited review removes edited pending badge by status", () => {
  const editedPending = withReviewEditingFlags([
    { ...baseReview, updatedAt: "2026-03-04T10:00:00.000Z" },
  ])[0];

  assert.equal(getReviewStatusPresentation(editedPending).label, "PENDING (Edited)");
  const approvedPresentation = getReviewStatusPresentation({
    status: "APPROVED",
    isEdited: editedPending.isEdited,
  });
  assert.equal(approvedPresentation.label, "APPROVED");
});
