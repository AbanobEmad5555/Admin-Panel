import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminReviewsService } from "@/features/admin-reviews/api/adminReviews.service";
import type { DeleteReviewPayload } from "@/features/admin-reviews/api/adminReviews.types";

export const getDeleteReviewInvalidationKeys = () => [["admin-reviews"]] as const;

export const useDeleteReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: DeleteReviewPayload) => adminReviewsService.deleteReview(input),
    onSuccess: async () => {
      const [reviewsKey] = getDeleteReviewInvalidationKeys();
      await queryClient.invalidateQueries({ queryKey: reviewsKey });
    },
  });
};
