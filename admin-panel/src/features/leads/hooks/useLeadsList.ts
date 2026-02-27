import { useQuery } from "@tanstack/react-query";
import { leadsApi } from "@/features/leads/api/leadsApi";
import type { LeadListParams } from "@/features/leads/types";

export const useLeadsList = (params: LeadListParams) => {
  return useQuery({
    queryKey: ["leads-list", params],
    queryFn: () => leadsApi.getLeadsList(params),
  });
};
