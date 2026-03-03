"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import AdminLayout from "@/components/layout/AdminLayout";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import type {
  AdminReviewExtended,
  AdminReviewsFilters,
} from "@/features/admin-reviews/api/adminReviews.types";
import ReviewDetailsDrawer from "@/features/admin-reviews/components/ReviewDetailsDrawer";
import ReviewFilters from "@/features/admin-reviews/components/ReviewFilters";
import ReviewsTable from "@/features/admin-reviews/components/ReviewsTable";
import { useAdminReviews } from "@/features/admin-reviews/hooks/useAdminReviews";
import { useDeleteReview } from "@/features/admin-reviews/hooks/useDeleteReview";
import { useUpdateReviewStatus } from "@/features/admin-reviews/hooks/useUpdateReviewStatus";
import {
  buildSearchParamsFromReviewsFilters,
  parseReviewsFiltersFromSearchParams,
} from "@/features/admin-reviews/utils/adminReviewsUrlState";
import { getCurrentAdminRole } from "@/features/admin-reviews/utils/adminRole";

const DEFAULT_FILTERS: AdminReviewsFilters = {
  page: 1,
  limit: 10,
};

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (!error || typeof error !== "object") {
    return fallback;
  }
  const maybeAxios = error as { response?: { data?: { message?: string } } };
  return maybeAxios.response?.data?.message ?? fallback;
};

export default function AdminRatingsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedReview, setSelectedReview] = useState<AdminReviewExtended | null>(null);
  const [reviewToDelete, setReviewToDelete] = useState<AdminReviewExtended | null>(null);
  const [mutatingReviewId, setMutatingReviewId] = useState<string | null>(null);

  const filters = useMemo(() => {
    const parsed = parseReviewsFiltersFromSearchParams(new URLSearchParams(searchParams.toString()));
    return { ...DEFAULT_FILTERS, ...parsed };
  }, [searchParams]);

  const role = useMemo(() => getCurrentAdminRole(), []);
  const isAuthorized = role === "ADMIN";

  useEffect(() => {
    if (!isAuthorized) {
      router.replace("/403");
    }
  }, [isAuthorized, router]);

  const { data, isLoading, isError, error } = useAdminReviews(filters);
  const updateStatus = useUpdateReviewStatus();
  const deleteReview = useDeleteReview();

  const reviews = useMemo(() => data?.items ?? [], [data?.items]);
  const pagination = data?.pagination ?? {
    page: filters.page,
    limit: filters.limit,
    totalItems: 0,
    totalPages: 1,
  };

  const setFilters = (next: AdminReviewsFilters) => {
    const params = buildSearchParamsFromReviewsFilters(next);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const goToPage = (nextPage: number) => {
    setFilters({
      ...filters,
      page: Math.max(1, Math.min(nextPage, pagination.totalPages)),
    });
  };

  const handleApprove = async (review: AdminReviewExtended) => {
    try {
      setMutatingReviewId(review.id);
      await updateStatus.mutateAsync({
        id: review.id,
        status: "APPROVED",
        productId: review.product.id,
      });
      setSelectedReview((previous) =>
        previous && previous.id === review.id
          ? {
              ...previous,
              status: "APPROVED",
            }
          : previous,
      );
      toast.success("Review approved.");
    } catch (mutationError) {
      toast.error(getApiErrorMessage(mutationError, "Failed to approve review."));
    } finally {
      setMutatingReviewId(null);
    }
  };

  const handleHide = async (review: AdminReviewExtended) => {
    try {
      setMutatingReviewId(review.id);
      await updateStatus.mutateAsync({
        id: review.id,
        status: "HIDDEN",
        productId: review.product.id,
      });
      setSelectedReview((previous) =>
        previous && previous.id === review.id
          ? {
              ...previous,
              status: "HIDDEN",
            }
          : previous,
      );
      toast.success("Review hidden.");
    } catch (mutationError) {
      toast.error(getApiErrorMessage(mutationError, "Failed to hide review."));
    } finally {
      setMutatingReviewId(null);
    }
  };

  const confirmDelete = async () => {
    if (!reviewToDelete) {
      return;
    }

    try {
      setMutatingReviewId(reviewToDelete.id);
      await deleteReview.mutateAsync({
        id: reviewToDelete.id,
        productId: reviewToDelete.product.id,
      });
      toast.success("Review deleted.");
      setReviewToDelete(null);
      if (selectedReview?.id === reviewToDelete.id) {
        setSelectedReview(null);
      }
    } catch (mutationError) {
      toast.error(getApiErrorMessage(mutationError, "Failed to delete review."));
    } finally {
      setMutatingReviewId(null);
    }
  };

  useEffect(() => {
    if (!selectedReview) {
      return;
    }

    const refreshed = reviews.find((review) => review.id === selectedReview.id);
    if (!refreshed) {
      setSelectedReview(null);
      return;
    }

    if (refreshed === selectedReview) {
      return;
    }

    setSelectedReview(refreshed);
  }, [reviews, selectedReview]);

  if (!isAuthorized) {
    return null;
  }

  return (
    <AdminLayout>
      <section className="space-y-4">
        <header className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">Ratings Moderation</h1>
          <p className="text-sm text-slate-500">
            Review, moderate, and manage customer ratings for products.
          </p>
        </header>

        <ReviewFilters
          value={filters}
          onApply={(next) => setFilters({ ...next, page: 1 })}
          onClear={(next) => setFilters(next)}
        />


        <ReviewsTable
          reviews={reviews}
          isLoading={isLoading}
          isError={isError}
          errorMessage={getApiErrorMessage(error, "Failed to load reviews.")}
          mutatingReviewId={mutatingReviewId}
          onOpenDetails={(review) => setSelectedReview(review)}
          onApprove={(review) => void handleApprove(review)}
          onHide={(review) => void handleHide(review)}
          onDelete={(review) => setReviewToDelete(review)}
        />

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <Button
            type="button"
            variant="secondary"
            disabled={pagination.page <= 1}
            onClick={() => goToPage(pagination.page - 1)}
          >
            Previous
          </Button>
          <div className="text-sm text-slate-600">
            Page <span className="font-semibold">{pagination.page}</span> of{" "}
            <span className="font-semibold">{pagination.totalPages}</span>
          </div>
          <Button
            type="button"
            variant="secondary"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => goToPage(pagination.page + 1)}
          >
            Next
          </Button>
        </div>
      </section>

      <ReviewDetailsDrawer
        review={selectedReview}
        open={Boolean(selectedReview)}
        isMutating={selectedReview ? mutatingReviewId === selectedReview.id : false}
        onClose={() => setSelectedReview(null)}
        onApprove={(review) => void handleApprove(review)}
        onHide={(review) => void handleHide(review)}
        onDelete={(review) => setReviewToDelete(review)}
      />

      <Modal
        title="Delete Review"
        isOpen={Boolean(reviewToDelete)}
        onClose={() => setReviewToDelete(null)}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            Are you sure you want to permanently delete this review? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setReviewToDelete(null)}
              disabled={deleteReview.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={deleteReview.isPending}
              onClick={() => void confirmDelete()}
            >
              {deleteReview.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
