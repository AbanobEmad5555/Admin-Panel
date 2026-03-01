import { useQuery } from "@tanstack/react-query";
import { posService } from "@/modules/pos/services/pos.service";

export const usePosProducts = () =>
  useQuery({
    queryKey: ["pos", "products"],
    queryFn: () => posService.getProducts(),
  });
