import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { adminReviewsService } from "@/features/admin-reviews/api/adminReviews.service";
import type { AdminReviewsFilters } from "@/features/admin-reviews/api/adminReviews.types";
import {
  filterOnlyEditedReviews,
  withReviewEditingFlags,
} from "@/features/admin-reviews/utils/reviewEditing";

export const useAdminReviews = (filters: AdminReviewsFilters) =>
  useQuery({
    queryKey: ["admin-reviews", filters],
    queryFn: () => adminReviewsService.getAdminReviews(filters),
    select: (data) => {
      const transformedReviews = withReviewEditingFlags(data.items);
      const filteredReviews = filterOnlyEditedReviews(
        transformedReviews,
        filters.onlyEdited,
      );

      return {
        ...data,
        items: filteredReviews,
      };
    },
    placeholderData: keepPreviousData,
  });
