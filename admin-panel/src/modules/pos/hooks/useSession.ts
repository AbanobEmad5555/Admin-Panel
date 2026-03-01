import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { posService } from "@/modules/pos/services/pos.service";
import type { CloseSessionInput, OpenSessionInput } from "@/modules/pos/types";

export const useCurrentSession = () =>
  useQuery({
    queryKey: ["pos", "session", "current"],
    queryFn: () => posService.getCurrentSession(),
  });

export const useOpenSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: OpenSessionInput) => posService.openSession(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pos", "session"] });
    },
  });
};

export const useCloseSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CloseSessionInput) => posService.closeSession(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pos", "session"] });
      void queryClient.invalidateQueries({ queryKey: ["pos", "report"] });
    },
  });
};

export const useSessionById = (sessionId?: string) =>
  useQuery({
    queryKey: ["pos", "session", sessionId],
    queryFn: () => posService.getSessionById(sessionId as string),
    enabled: Boolean(sessionId),
  });
