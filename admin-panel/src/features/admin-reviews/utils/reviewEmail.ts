import type { AdminReview } from "@/features/admin-reviews/api/adminReviews.types";

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

export const buildReviewContactEmailBody = (review: AdminReview) => {
  return [
    "Hello,",
    "",
    "Regarding your product review,",
    "",
    `Product: ${review.product.name}`,
    `Rating: ${review.rating}`,
    `Comment: ${review.comment ?? "No comment provided"}`,
    `Date: ${formatDateTime(review.createdAt)}`,
    "",
    "Thanks,",
    "Admin Team",
  ].join("\n");
};

export const buildReviewContactGmailComposeUrl = (review: AdminReview) => {
  const to = encodeURIComponent(review.user.email);
  return `https://mail.google.com/mail/u/0/#inbox?compose=new&to=${to}`;
};
