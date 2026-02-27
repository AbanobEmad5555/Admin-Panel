import { useQuery } from "@tanstack/react-query";
import { leadsApi } from "@/features/leads/api/leadsApi";

export const usePipeline = () => {
  return useQuery({
    queryKey: ["leads", "pipeline"],
    queryFn: () => leadsApi.getPipeline(),
  });
};
