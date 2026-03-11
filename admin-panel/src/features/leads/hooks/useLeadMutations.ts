import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { leadsApi } from "@/features/leads/api/leadsApi";
import type {
  Lead,
  LeadPayload,
  LeadStatus,
  PipelineColumn,
} from "@/features/leads/types";

type UpdateLeadStatusInput = {
  id: number;
  status: LeadStatus;
  sourceStatus?: LeadStatus;
  sourceIndex?: number;
  destinationStatus?: LeadStatus;
  destinationIndex?: number;
};

type UpdateLeadStatusContext = {
  previousPipeline?: PipelineColumn[];
};

const getLeadToastText = () => {
  if (typeof window === "undefined") {
    return {
      created: "Lead created successfully",
      createFailed: "Failed to create lead",
      updated: "Lead updated successfully",
      updateFailed: "Failed to update lead",
      assigned: "Lead assigned to admin",
      assignFailed: "Failed to assign admin",
      statusUpdated: "Lead status updated",
      statusFailed: "Failed to update lead status",
    };
  }

  const raw = window.localStorage.getItem("admin-localization-settings");
  const language = raw?.includes('"language":"ar"') ? "ar" : "en";

  if (language === "ar") {
    return {
      created: "تم إنشاء العميل المحتمل بنجاح",
      createFailed: "فشل إنشاء العميل المحتمل",
      updated: "تم تحديث العميل المحتمل بنجاح",
      updateFailed: "فشل تحديث العميل المحتمل",
      assigned: "تم تعيين العميل المحتمل للمسؤول",
      assignFailed: "فشل تعيين المسؤول",
      statusUpdated: "تم تحديث حالة العميل المحتمل",
      statusFailed: "فشل تحديث حالة العميل المحتمل",
    };
  }

  return {
    created: "Lead created successfully",
    createFailed: "Failed to create lead",
    updated: "Lead updated successfully",
    updateFailed: "Failed to update lead",
    assigned: "Lead assigned to admin",
    assignFailed: "Failed to assign admin",
    statusUpdated: "Lead status updated",
    statusFailed: "Failed to update lead status",
  };
};

const moveLeadInPipeline = (
  pipeline: PipelineColumn[],
  input: UpdateLeadStatusInput
): PipelineColumn[] => {
  const next = pipeline.map((column) => ({
    ...column,
    leads: [...column.leads],
  }));

  let movedLead: Lead | undefined;

  if (input.sourceStatus && typeof input.sourceIndex === "number") {
    const sourceColumn = next.find((column) => column.status === input.sourceStatus);
    if (sourceColumn && sourceColumn.leads[input.sourceIndex]?.id === input.id) {
      const [removed] = sourceColumn.leads.splice(input.sourceIndex, 1);
      movedLead = removed;
    }
  }

  if (!movedLead) {
    for (const column of next) {
      const index = column.leads.findIndex((lead) => lead.id === input.id);
      if (index !== -1) {
        const [removed] = column.leads.splice(index, 1);
        movedLead = removed;
        break;
      }
    }
  }

  if (!movedLead) {
    return pipeline;
  }

  movedLead = { ...movedLead, status: input.status };

  const targetStatus = input.destinationStatus ?? input.status;
  const targetColumn = next.find((column) => column.status === targetStatus);
  if (!targetColumn) {
    return pipeline;
  }

  const targetIndex =
    typeof input.destinationIndex === "number"
      ? Math.max(0, Math.min(input.destinationIndex, targetColumn.leads.length))
      : 0;

  targetColumn.leads.splice(targetIndex, 0, movedLead);
  return next;
};

export const useCreateLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LeadPayload) => leadsApi.createLead(payload),
    onSuccess: () => {
      toast.success(getLeadToastText().created);
      void queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: () => {
      toast.error(getLeadToastText().createFailed);
    },
  });
};

export const useUpdateLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<LeadPayload> }) =>
      leadsApi.updateLead(id, payload),
    onSuccess: () => {
      toast.success(getLeadToastText().updated);
      void queryClient.invalidateQueries({ queryKey: ["leads"] });
      void queryClient.invalidateQueries({ queryKey: ["leads", "pipeline"] });
    },
    onError: () => {
      toast.error(getLeadToastText().updateFailed);
    },
  });
};

export const useAssignLeadAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leadId, adminId }: { leadId: number; adminId: number }) =>
      leadsApi.assignLeadAdmin(leadId, adminId),
    onSuccess: () => {
      toast.success(getLeadToastText().assigned);
      void queryClient.invalidateQueries({ queryKey: ["leads-list"] });
      void queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: () => {
      toast.error(getLeadToastText().assignFailed);
    },
  });
};

export const useUpdateLeadStatus = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, UpdateLeadStatusInput, UpdateLeadStatusContext>({
    mutationFn: ({ id, status }) => leadsApi.updateLeadStatus(id, status),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ["leads", "pipeline"] });
      const previousPipeline = queryClient.getQueryData<PipelineColumn[]>(["leads", "pipeline"]);

      if (previousPipeline) {
        queryClient.setQueryData(["leads", "pipeline"], moveLeadInPipeline(previousPipeline, input));
      }

      return { previousPipeline };
    },
    onSuccess: () => {
      toast.success(getLeadToastText().statusUpdated);
      void queryClient.invalidateQueries({ queryKey: ["leads", "pipeline"] });
      void queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (_error, _variables, context) => {
      if (context?.previousPipeline) {
        queryClient.setQueryData(["leads", "pipeline"], context.previousPipeline);
      }
      toast.error(getLeadToastText().statusFailed);
    },
  });
};
