"use client";

import type { AdminReviewExtended } from "@/features/admin-reviews/api/adminReviews.types";
import ReviewRow from "@/features/admin-reviews/components/ReviewRow";

type ReviewsTableProps = {
  reviews: AdminReviewExtended[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  mutatingReviewId?: string | null;
  onOpenDetails: (review: AdminReviewExtended) => void;
  onApprove: (review: AdminReviewExtended) => void;
  onHide: (review: AdminReviewExtended) => void;
  onDelete: (review: AdminReviewExtended) => void;
};

const TABLE_COLUMNS = [
  "Review ID",
  "Product",
  "User",
  "Phone",
  "Rating",
  "Status",
  "Date",
  "Actions",
];

export default function ReviewsTable({
  reviews,
  isLoading,
  isError,
  errorMessage,
  mutatingReviewId,
  onOpenDetails,
  onApprove,
  onHide,
  onDelete,
}: ReviewsTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {isError ? (
        <div className="border-b border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage || "Failed to load reviews."}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="min-w-[1120px] w-full text-left">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {TABLE_COLUMNS.map((column) => (
                <th key={column} className="px-3 py-3 font-semibold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <tr key={`skeleton-${index}`}>
                    {TABLE_COLUMNS.map((column) => (
                      <td key={`${column}-${index}`} className="px-3 py-3">
                        <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
                      </td>
                    ))}
                  </tr>
                ))
              : null}

            {!isLoading && !isError && reviews.length === 0 ? (
              <tr>
                <td colSpan={TABLE_COLUMNS.length} className="px-3 py-12 text-center">
                  <p className="text-base font-semibold text-slate-800">
                    No reviews found for selected filters.
                  </p>
                </td>
              </tr>
            ) : null}

            {!isLoading && !isError
              ? reviews.map((review) => (
                  <ReviewRow
                    key={review.id}
                    review={review}
                    onOpenDetails={onOpenDetails}
                    onApprove={onApprove}
                    onHide={onHide}
                    onDelete={onDelete}
                    isMutating={mutatingReviewId === review.id}
                  />
                ))
              : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
