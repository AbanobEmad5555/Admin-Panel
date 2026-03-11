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
import { useLocalization } from "@/modules/localization/LocalizationProvider";

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
  const { language } = useLocalization();
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
  const text = useMemo(
    () =>
      language === "ar"
        ? {
            pageTitle: "إدارة التقييمات",
            pageSubtitle: "مراجعة تقييمات العملاء للمنتجات وإدارتها والإشراف عليها.",
            approved: "تمت الموافقة على التقييم.",
            approveError: "فشل الموافقة على التقييم.",
            hidden: "تم إخفاء التقييم.",
            hideError: "فشل إخفاء التقييم.",
            deleted: "تم حذف التقييم.",
            deleteError: "فشل حذف التقييم.",
            loadError: "فشل تحميل التقييمات.",
            previous: "السابق",
            next: "التالي",
            page: "الصفحة",
            of: "من",
            deleteReview: "حذف التقييم",
            deleteDescription:
              "هل أنت متأكد أنك تريد حذف هذا التقييم نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.",
            cancel: "إلغاء",
            deleting: "جارٍ الحذف...",
            delete: "حذف",
          }
        : {
            pageTitle: "Ratings Moderation",
            pageSubtitle: "Review, moderate, and manage customer ratings for products.",
            approved: "Review approved.",
            approveError: "Failed to approve review.",
            hidden: "Review hidden.",
            hideError: "Failed to hide review.",
            deleted: "Review deleted.",
            deleteError: "Failed to delete review.",
            loadError: "Failed to load reviews.",
            previous: "Previous",
            next: "Next",
            page: "Page",
            of: "of",
            deleteReview: "Delete Review",
            deleteDescription:
              "Are you sure you want to permanently delete this review? This action cannot be undone.",
            cancel: "Cancel",
            deleting: "Deleting...",
            delete: "Delete",
          },
    [language],
  );

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
      toast.success(text.approved);
    } catch (mutationError) {
      toast.error(getApiErrorMessage(mutationError, text.approveError));
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
      toast.success(text.hidden);
    } catch (mutationError) {
      toast.error(getApiErrorMessage(mutationError, text.hideError));
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
      toast.success(text.deleted);
      setReviewToDelete(null);
      if (selectedReview?.id === reviewToDelete.id) {
        setSelectedReview(null);
      }
    } catch (mutationError) {
      toast.error(getApiErrorMessage(mutationError, text.deleteError));
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
          <h1 className="text-xl font-semibold text-slate-900">{text.pageTitle}</h1>
          <p className="text-sm text-slate-500">{text.pageSubtitle}</p>
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
          errorMessage={getApiErrorMessage(error, text.loadError)}
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
            {text.previous}
          </Button>
          <div className="text-sm text-slate-600">
            {text.page} <span className="font-semibold">{pagination.page}</span> {text.of}{" "}
            <span className="font-semibold">{pagination.totalPages}</span>
          </div>
          <Button
            type="button"
            variant="secondary"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => goToPage(pagination.page + 1)}
          >
            {text.next}
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
        title={text.deleteReview}
        isOpen={Boolean(reviewToDelete)}
        onClose={() => setReviewToDelete(null)}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-700">{text.deleteDescription}</p>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setReviewToDelete(null)}
              disabled={deleteReview.isPending}
            >
              {text.cancel}
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={deleteReview.isPending}
              onClick={() => void confirmDelete()}
            >
              {deleteReview.isPending ? text.deleting : text.delete}
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
