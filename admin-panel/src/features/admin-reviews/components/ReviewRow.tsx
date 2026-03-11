"use client";

import Button from "@/components/ui/Button";
import { Pencil, Star, StarHalf } from "lucide-react";
import ContactUserButton from "@/features/admin-reviews/components/ContactUserButton";
import type { AdminReviewExtended } from "@/features/admin-reviews/api/adminReviews.types";
import { canApproveReview, canHideReview } from "@/features/admin-reviews/utils/reviewActions";
import {
  getReviewStatusPresentation,
  isEditedPendingReview,
} from "@/features/admin-reviews/utils/reviewEditing";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

type ReviewRowProps = {
  review: AdminReviewExtended;
  onOpenDetails: (review: AdminReviewExtended) => void;
  onApprove: (review: AdminReviewExtended) => void;
  onHide: (review: AdminReviewExtended) => void;
  onDelete: (review: AdminReviewExtended) => void;
  isMutating: boolean;
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

const getInitials = (firstName: string, lastName: string) =>
  `${firstName.slice(0, 1)}${lastName.slice(0, 1)}`.toUpperCase() || "U";

const renderStars = (rating: number) => {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;

  return (
    <div className="flex items-center gap-1 text-amber-500">
      {Array.from({ length: 5 }).map((_, index) => {
        if (index < fullStars) {
          return <Star key={index} className="h-4 w-4 fill-current" />;
        }
        if (index === fullStars && hasHalf) {
          return <StarHalf key={index} className="h-4 w-4 fill-current" />;
        }
        return <Star key={index} className="h-4 w-4 text-slate-300" />;
      })}
      <span className="ml-1 text-xs font-medium text-slate-600">{rating.toFixed(1)}</span>
    </div>
  );
};

export default function ReviewRow({
  review,
  onOpenDetails,
  onApprove,
  onHide,
  onDelete,
  isMutating,
}: ReviewRowProps) {
  const { language } = useLocalization();
  const statusPresentation = getReviewStatusPresentation(review, language);
  const text =
    language === "ar"
      ? {
          details: "التفاصيل",
          approve: "موافقة",
          hide: "إخفاء",
          delete: "حذف",
          edited: "معدل",
        }
      : {
          details: "Details",
          approve: "Approve",
          hide: "Hide",
          delete: "Delete",
          edited: "Edited",
        };

  return (
    <tr
      className="cursor-pointer text-sm text-slate-700 hover:bg-slate-50"
      onClick={() => onOpenDetails(review)}
    >
      <td className="px-3 py-3 font-mono text-xs text-slate-600">{review.id}</td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 overflow-hidden rounded-md border border-slate-200 bg-slate-100">
            {review.product.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={review.product.image}
                alt={review.product.name}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <div>
            <p className="font-medium text-slate-900">{review.product.name}</p>
            <p className="text-xs text-slate-500">{review.product.sku}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          {review.user.profileImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={review.user.profileImage}
              alt={`${review.user.firstName} ${review.user.lastName}`}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
              {getInitials(review.user.firstName, review.user.lastName)}
            </div>
          )}
          <div>
            <p className="font-medium text-slate-900">
              {review.user.firstName} {review.user.lastName}
            </p>
            <p className="text-xs text-slate-500">{review.user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-3">{review.user.phone || "-"}</td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          {renderStars(review.rating)}
          {isEditedPendingReview(review) ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700">
              <Pencil className="h-3 w-3" />
              {text.edited}
            </span>
          ) : null}
        </div>
      </td>
      <td className="px-3 py-3">
        <span
          aria-label={statusPresentation.ariaLabel}
          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusPresentation.className}`}
        >
          {statusPresentation.label}
        </span>
      </td>
      <td className="px-3 py-3 whitespace-nowrap">{formatDate(review.createdAt)}</td>
      <td className="px-3 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={(event) => {
              event.stopPropagation();
              onOpenDetails(review);
            }}
          >
            {text.details}
          </Button>
          {canApproveReview(review.status) ? (
            <Button
              type="button"
              disabled={isMutating}
              onClick={(event) => {
                event.stopPropagation();
                onApprove(review);
              }}
              className="bg-emerald-600 text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {text.approve}
            </Button>
          ) : null}
          {canHideReview(review.status) ? (
            <Button
              type="button"
              variant="secondary"
              disabled={isMutating}
              onClick={(event) => {
                event.stopPropagation();
                onHide(review);
              }}
            >
              {text.hide}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="danger"
            disabled={isMutating}
            onClick={(event) => {
              event.stopPropagation();
              onDelete(review);
            }}
          >
            {text.delete}
          </Button>
          <div
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <ContactUserButton review={review} />
          </div>
        </div>
      </td>
    </tr>
  );
}
