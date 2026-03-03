"use client";

import type { AdminReview } from "@/features/admin-reviews/api/adminReviews.types";
import { buildReviewContactGmailComposeUrl } from "@/features/admin-reviews/utils/reviewEmail";

type ContactUserButtonProps = {
  review: AdminReview;
  className?: string;
};

export default function ContactUserButton({ review, className = "" }: ContactUserButtonProps) {
  return (
    <a
      href={buildReviewContactGmailComposeUrl(review)}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 ${className}`}
    >
      Contact User
    </a>
  );
}
