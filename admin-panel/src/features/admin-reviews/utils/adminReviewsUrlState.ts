import type { AdminReviewsFilters, ReviewStatus } from "@/features/admin-reviews/api/adminReviews.types";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

const ALLOWED_STATUS: ReviewStatus[] = ["PENDING", "APPROVED", "HIDDEN"];

const parsePositiveInteger = (value: string | null, fallback: number) => {
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(1, Math.trunc(parsed));
};

const parseStatus = (value: string | null): ReviewStatus | undefined => {
  if (!value) {
    return undefined;
  }
  const normalized = value.toUpperCase() as ReviewStatus;
  return ALLOWED_STATUS.includes(normalized) ? normalized : undefined;
};

export const parseReviewsFiltersFromSearchParams = (
  searchParams: URLSearchParams,
): AdminReviewsFilters => {
  const page = parsePositiveInteger(searchParams.get("page"), DEFAULT_PAGE);
  const limit = parsePositiveInteger(searchParams.get("limit"), DEFAULT_LIMIT);
  const status = parseStatus(searchParams.get("status"));
  const reviewId = searchParams.get("reviewId")?.trim() || undefined;
  const onlyEdited = searchParams.get("onlyEdited") === "1";
  const productId = searchParams.get("productId")?.trim() || undefined;
  const userId = searchParams.get("userId")?.trim() || undefined;
  const startDate = searchParams.get("startDate")?.trim() || undefined;
  const endDate = searchParams.get("endDate")?.trim() || undefined;

  return {
    page,
    limit,
    reviewId,
    onlyEdited,
    status,
    productId,
    userId,
    startDate,
    endDate,
  };
};

export const buildSearchParamsFromReviewsFilters = (
  filters: AdminReviewsFilters,
): URLSearchParams => {
  const params = new URLSearchParams();
  params.set("page", String(Math.max(1, filters.page || DEFAULT_PAGE)));
  params.set("limit", String(Math.max(1, filters.limit || DEFAULT_LIMIT)));

  if (filters.reviewId?.trim()) {
    params.set("reviewId", filters.reviewId.trim());
  }
  if (filters.onlyEdited) {
    params.set("onlyEdited", "1");
  }
  if (filters.status) {
    params.set("status", filters.status);
  }
  if (filters.productId?.trim()) {
    params.set("productId", filters.productId.trim());
  }
  if (filters.userId?.trim()) {
    params.set("userId", filters.userId.trim());
  }
  if (filters.startDate?.trim()) {
    params.set("startDate", filters.startDate.trim());
  }
  if (filters.endDate?.trim()) {
    params.set("endDate", filters.endDate.trim());
  }

  return params;
};
