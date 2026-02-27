import { useQuery } from "@tanstack/react-query";
import { leadsApi } from "@/features/leads/api/leadsApi";
import type { LeadFilters } from "@/features/leads/types";

export const useLeads = (filters: LeadFilters) => {
  return useQuery({
    queryKey: ["leads", filters],
    queryFn: () => leadsApi.getLeads(filters),
  });
};
