import type { AdminReview } from "@/features/admin-reviews/api/adminReviews.types";

export const canApproveReview = (status: AdminReview["status"]) =>
  status === "PENDING" || status === "HIDDEN";

export const canHideReview = (status: AdminReview["status"]) => status === "APPROVED";

