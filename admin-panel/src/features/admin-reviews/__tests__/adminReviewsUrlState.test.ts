import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSearchParamsFromReviewsFilters,
  parseReviewsFiltersFromSearchParams,
} from "@/features/admin-reviews/utils/adminReviewsUrlState";

test("builds review filters into URL query params", () => {
  const params = buildSearchParamsFromReviewsFilters({
    page: 3,
    limit: 20,
    reviewId: "rev-1",
    onlyEdited: true,
    status: "PENDING",
    productId: "prod-1",
    userId: "user-1",
    startDate: "2026-02-01",
    endDate: "2026-02-28",
  });

  assert.equal(params.get("page"), "3");
  assert.equal(params.get("limit"), "20");
  assert.equal(params.get("reviewId"), "rev-1");
  assert.equal(params.get("onlyEdited"), "1");
  assert.equal(params.get("status"), "PENDING");
  assert.equal(params.get("productId"), "prod-1");
  assert.equal(params.get("userId"), "user-1");
  assert.equal(params.get("startDate"), "2026-02-01");
  assert.equal(params.get("endDate"), "2026-02-28");
});

test("parses review filters from URL query params", () => {
  const parsed = parseReviewsFiltersFromSearchParams(
    new URLSearchParams(
      "page=2&limit=50&reviewId=rev-22&onlyEdited=1&status=APPROVED&productId=prod-22&userId=user-9&startDate=2026-01-01&endDate=2026-01-31",
    ),
  );

  assert.deepEqual(parsed, {
    page: 2,
    limit: 50,
    reviewId: "rev-22",
    onlyEdited: true,
    status: "APPROVED",
    productId: "prod-22",
    userId: "user-9",
    startDate: "2026-01-01",
    endDate: "2026-01-31",
  });
});

test("round-trips filters for pagination and persistence", () => {
  const input = {
    page: 4,
    limit: 10,
    reviewId: "r44",
    onlyEdited: true,
    status: "HIDDEN" as const,
    productId: "p44",
    userId: "u12",
    startDate: "2026-03-01",
    endDate: "2026-03-10",
  };
  const query = buildSearchParamsFromReviewsFilters(input);
  const output = parseReviewsFiltersFromSearchParams(new URLSearchParams(query.toString()));

  assert.deepEqual(output, input);
});
