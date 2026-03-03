import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminReviewsService } from "@/features/admin-reviews/api/adminReviews.service";
import type { UpdateReviewStatusPayload } from "@/features/admin-reviews/api/adminReviews.types";

export const getReviewStatusInvalidationKeys = (productId: string) =>
  [
    ["admin-reviews"],
    ["rating-summary", productId],
    ["product-reviews", productId],
  ] as const;

export const useUpdateReviewStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateReviewStatusPayload) =>
      adminReviewsService.updateReviewStatus(input),
    onSuccess: async (_data, variables) => {
      const keys = getReviewStatusInvalidationKeys(variables.productId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: keys[0] }),
        queryClient.invalidateQueries({ queryKey: keys[1] }),
        queryClient.invalidateQueries({ queryKey: keys[2] }),
      ]);
    },
  });
};
