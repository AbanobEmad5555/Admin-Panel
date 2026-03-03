import assert from "node:assert/strict";
import test from "node:test";
import type { AdminReview } from "@/features/admin-reviews/api/adminReviews.types";
import { buildReviewContactGmailComposeUrl } from "@/features/admin-reviews/utils/reviewEmail";

const sampleReview: AdminReview = {
  id: "rev-1",
  rating: 4.5,
  comment: "Great quality",
  status: "PENDING",
  createdAt: "2026-02-20T10:15:00.000Z",
  updatedAt: "2026-02-20T10:15:00.000Z",
  user: {
    id: "user-1",
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.com",
    phone: "+201111111111",
  },
  product: {
    id: "prod-1",
    name: "Sample Product",
    sku: "SKU-001",
  },
  media: [],
};

test("generates Gmail compose link with recipient prefilled", () => {
  const url = buildReviewContactGmailComposeUrl(sampleReview);

  assert.ok(url.startsWith("https://mail.google.com/mail/u/0/#inbox?compose=new"));
  assert.ok(url.includes("to=jane%40example.com"));
});
