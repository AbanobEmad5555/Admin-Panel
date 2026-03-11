"use client";

import Button from "@/components/ui/Button";
import ContactUserButton from "@/features/admin-reviews/components/ContactUserButton";
import ReviewMediaGallery from "@/features/admin-reviews/components/ReviewMediaGallery";
import type { AdminReviewExtended } from "@/features/admin-reviews/api/adminReviews.types";
import { canApproveReview, canHideReview } from "@/features/admin-reviews/utils/reviewActions";
import { shouldShowEditedNotice } from "@/features/admin-reviews/utils/reviewEditing";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

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
  const { language } = useLocalization();
  const text =
    language === "ar"
      ? {
          close: "إغلاق",
          title: "تفاصيل التقييم",
          review: "التقييم",
          noComment: "لم يترك العميل تعليقًا.",
          rating: "التقييم",
          status: "الحالة",
          submitted: "تاريخ الإرسال",
          updated: "آخر تحديث",
          editedNotice: "تم تعديل هذا التقييم بواسطة المستخدم.",
          product: "المنتج",
          name: "الاسم",
          sku: "رمز المنتج",
          productId: "معرّف المنتج",
          customer: "العميل",
          email: "البريد الإلكتروني",
          phone: "الهاتف",
          userId: "معرّف المستخدم",
          media: "الوسائط",
          moderationActions: "إجراءات الإشراف",
          approve: "موافقة",
          hide: "إخفاء",
          delete: "حذف",
        }
      : {
          close: "Close",
          title: "Review Details",
          review: "Review",
          noComment: "No comment provided by customer.",
          rating: "Rating",
          status: "Status",
          submitted: "Submitted",
          updated: "Last Updated",
          editedNotice: "This review was edited by the user.",
          product: "Product",
          name: "Name",
          sku: "SKU",
          productId: "Product ID",
          customer: "Customer",
          email: "Email",
          phone: "Phone",
          userId: "User ID",
          media: "Media",
          moderationActions: "Moderation Actions",
          approve: "Approve",
          hide: "Hide",
          delete: "Delete",
        };
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
          <h2 className="text-lg font-semibold text-slate-900">{text.title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-slate-600 hover:text-slate-800"
          >
            {text.close}
          </button>
        </div>

        <div className="space-y-5 p-4">
          <section className="rounded-lg border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-900">{text.review}</h3>
            <p className="mt-2 text-sm text-slate-700">
              {review.comment || text.noComment}
            </p>
            <div className="mt-3 text-xs text-slate-500">
              {text.rating}: {review.rating.toFixed(1)} | {text.status}: {review.status}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              {text.submitted}: {formatDateTime(review.createdAt)}
            </div>
            <div className="text-xs text-slate-500">
              {text.updated}: {formatDateTime(review.updatedAt)}
            </div>
            {shouldShowEditedNotice(review) ? (
              <p className="mt-2 text-xs text-sky-700">{text.editedNotice}</p>
            ) : null}
          </section>

          <section className="rounded-lg border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-900">{text.product}</h3>
            <p className="mt-2 text-sm text-slate-700">{text.name}: {review.product.name}</p>
            <p className="text-sm text-slate-700">{text.sku}: {review.product.sku}</p>
            <p className="text-sm text-slate-700">{text.productId}: {review.product.id}</p>
          </section>

          <section className="rounded-lg border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-900">{text.customer}</h3>
            <p className="mt-2 text-sm text-slate-700">
              {text.name}: {review.user.firstName} {review.user.lastName}
            </p>
            <p className="text-sm text-slate-700">{text.email}: {review.user.email}</p>
            <p className="text-sm text-slate-700">{text.phone}: {review.user.phone || "-"}</p>
            <p className="text-sm text-slate-700">{text.userId}: {review.user.id}</p>
          </section>

          <section className="rounded-lg border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-900">{text.media}</h3>
            <div className="mt-3">
              <ReviewMediaGallery media={review.media} />
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-900">{text.moderationActions}</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {canApproveReview(review.status) ? (
                <Button
                  type="button"
                  disabled={isMutating}
                  onClick={() => onApprove(review)}
                  className="bg-emerald-600 text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {text.approve}
                </Button>
              ) : null}
              {canHideReview(review.status) ? (
                <Button type="button" variant="secondary" disabled={isMutating} onClick={() => onHide(review)}>
                  {text.hide}
                </Button>
              ) : null}
              <Button type="button" variant="danger" disabled={isMutating} onClick={() => onDelete(review)}>
                {text.delete}
              </Button>
              <ContactUserButton review={review} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
