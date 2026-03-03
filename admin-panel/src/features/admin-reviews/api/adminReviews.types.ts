export type ReviewStatus = "PENDING" | "APPROVED" | "HIDDEN";

export interface AdminReview {
  id: string;
  rating: number;
  comment: string | null;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    profileImage?: string;
  };
  product: {
    id: string;
    name: string;
    sku: string;
    image?: string;
  };
  media: {
    url: string;
    type: "IMAGE" | "VIDEO";
  }[];
}

export type AdminReviewsFilters = {
  page: number;
  limit: number;
  reviewId?: string;
  onlyEdited?: boolean;
  status?: ReviewStatus;
  productId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
};

export interface AdminReviewExtended extends AdminReview {
  isEdited: boolean;
}

export type AdminReviewsPagination = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};

export type AdminReviewsResponse = {
  items: AdminReview[];
  pagination: AdminReviewsPagination;
};

export type UpdateReviewStatusPayload = {
  id: string;
  status: Extract<ReviewStatus, "APPROVED" | "HIDDEN">;
  productId: string;
};

export type DeleteReviewPayload = {
  id: string;
  productId: string;
};
