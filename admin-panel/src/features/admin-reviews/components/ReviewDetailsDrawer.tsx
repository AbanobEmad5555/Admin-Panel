"use client";

import Button from "@/components/ui/Button";
import ContactUserButton from "@/features/admin-reviews/components/ContactUserButton";
import ReviewMediaGallery from "@/features/admin-reviews/components/ReviewMediaGallery";
import type { AdminReviewExtended } from "@/features/admin-reviews/api/adminReviews.types";
import { canApproveReview, canHideReview } from "@/features/admin-reviews/utils/reviewActions";
import { shouldShowEditedNotice } from "@/features/admin-reviews/utils/reviewEditing";

type ReviewDetailsDrawerProps = {
  review: AdminReviewExtended | null;
  open: boolean;
  isMutating: boolean;
  onClose: () => void;
  onApprove: (review: AdminReviewExtended) => void;
  onHide: (review: AdminReviewExtended) => void;
  onDelete: (review: AdminReviewExtended) => void;
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function ReviewDetailsDrawer({
  review,
  open,
  isMutating,
  onClose,
  onApprove,
  onHide,
  onDelete,
}: ReviewDetailsDrawerProps) {
  if (!open || !review) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/35"
      onClick={onClose}
    >
      <div
        className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <h2 className="text-lg font-semibold text-slate-900">Review Details</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-slate-600 hover:text-slate-800"
          >
            Close
          </button>
        </div>

        <div className="space-y-5 p-4">
          <section className="rounded-lg border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Review</h3>
            <p className="mt-2 text-sm text-slate-700">
              {review.comment || "No comment provided by customer."}
            </p>
            <div className="mt-3 text-xs text-slate-500">
              Rating: {review.rating.toFixed(1)} | Status: {review.status}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Submitted: {formatDateTime(review.createdAt)}
            </div>
            <div className="text-xs text-slate-500">
              Last Updated: {formatDateTime(review.updatedAt)}
            </div>
            {shouldShowEditedNotice(review) ? (
              <p className="mt-2 text-xs text-sky-700">
                This review was edited by the user.
              </p>
            ) : null}
          </section>

          <section className="rounded-lg border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Product</h3>
            <p className="mt-2 text-sm text-slate-700">Name: {review.product.name}</p>
            <p className="text-sm text-slate-700">SKU: {review.product.sku}</p>
            <p className="text-sm text-slate-700">Product ID: {review.product.id}</p>
          </section>

          <section className="rounded-lg border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Customer</h3>
            <p className="mt-2 text-sm text-slate-700">
              Name: {review.user.firstName} {review.user.lastName}
            </p>
            <p className="text-sm text-slate-700">Email: {review.user.email}</p>
            <p className="text-sm text-slate-700">Phone: {review.user.phone || "-"}</p>
            <p className="text-sm text-slate-700">User ID: {review.user.id}</p>
          </section>

          <section className="rounded-lg border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Media</h3>
            <div className="mt-3">
              <ReviewMediaGallery media={review.media} />
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Moderation Actions</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {canApproveReview(review.status) ? (
                <Button
                  type="button"
                  disabled={isMutating}
                  onClick={() => onApprove(review)}
                  className="bg-emerald-600 text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Approve
                </Button>
              ) : null}
              {canHideReview(review.status) ? (
                <Button type="button" variant="secondary" disabled={isMutating} onClick={() => onHide(review)}>
                  Hide
                </Button>
              ) : null}
              <Button type="button" variant="danger" disabled={isMutating} onClick={() => onDelete(review)}>
                Delete
              </Button>
              <ContactUserButton review={review} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
