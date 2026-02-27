import { useQuery } from "@tanstack/react-query";
import { leadsApi } from "@/features/leads/api/leadsApi";

export const useLeadAdmins = () => {
  return useQuery({
    queryKey: ["lead-admin-users"],
    queryFn: () => leadsApi.getAdminUsers(),
  });
};
