import type {
  AdminReview,
  AdminReviewExtended,
} from "@/features/admin-reviews/api/adminReviews.types";

export const isReviewEdited = (review: Pick<AdminReview, "createdAt" | "updatedAt">) =>
  review.updatedAt !== review.createdAt;

export const isEditedPendingReview = (
  review: Pick<AdminReviewExtended, "status" | "isEdited">,
) => review.status === "PENDING" && review.isEdited;

export const shouldShowEditedNotice = (
  review: Pick<AdminReviewExtended, "status" | "isEdited">,
) => isEditedPendingReview(review);

export const withReviewEditingFlags = (reviews: AdminReview[]): AdminReviewExtended[] =>
  reviews.map((review) => ({
    ...review,
    isEdited: isReviewEdited(review),
  }));

export const filterOnlyEditedReviews = (
  reviews: AdminReviewExtended[],
  onlyEdited?: boolean,
) =>
  onlyEdited
    ? reviews.filter((review) => isEditedPendingReview(review))
    : reviews;

export const getReviewStatusPresentation = (
  review: Pick<AdminReviewExtended, "status" | "isEdited">,
) => {
  if (isEditedPendingReview(review)) {
    return {
      label: "PENDING (Edited)",
      className: "border-sky-200 bg-sky-100 text-sky-800",
      ariaLabel: "Edited review pending moderation",
    };
  }

  if (review.status === "PENDING") {
    return {
      label: "PENDING",
      className: "border-amber-200 bg-amber-100 text-amber-800",
      ariaLabel: undefined,
    };
  }

  if (review.status === "APPROVED") {
    return {
      label: "APPROVED",
      className: "border-emerald-200 bg-emerald-100 text-emerald-800",
      ariaLabel: undefined,
    };
  }

  return {
    label: "HIDDEN",
    className: "border-slate-200 bg-slate-100 text-slate-700",
    ariaLabel: undefined,
  };
};
