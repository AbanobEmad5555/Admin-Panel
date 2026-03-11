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
  language: "en" | "ar" = "en",
) => {
  const labels =
    language === "ar"
      ? {
          pendingEdited: "قيد المراجعة (معدل)",
          pendingEditedAria: "تقييم معدل بانتظار الإشراف",
          pending: "قيد المراجعة",
          approved: "مقبول",
          hidden: "مخفي",
        }
      : {
          pendingEdited: "PENDING (Edited)",
          pendingEditedAria: "Edited review pending moderation",
          pending: "PENDING",
          approved: "APPROVED",
          hidden: "HIDDEN",
        };
  if (isEditedPendingReview(review)) {
    return {
      label: labels.pendingEdited,
      className: "border-sky-200 bg-sky-100 text-sky-800",
      ariaLabel: labels.pendingEditedAria,
    };
  }

  if (review.status === "PENDING") {
    return {
      label: labels.pending,
      className: "border-amber-200 bg-amber-100 text-amber-800",
      ariaLabel: undefined,
    };
  }

  if (review.status === "APPROVED") {
    return {
      label: labels.approved,
      className: "border-emerald-200 bg-emerald-100 text-emerald-800",
      ariaLabel: undefined,
    };
  }

  return {
    label: labels.hidden,
    className: "border-slate-200 bg-slate-100 text-slate-700",
    ariaLabel: undefined,
  };
};
