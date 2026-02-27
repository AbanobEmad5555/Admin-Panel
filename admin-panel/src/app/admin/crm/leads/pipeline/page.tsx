"use client";

import { useMemo } from "react";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import AdminLayout from "@/components/layout/AdminLayout";
import PipelineColumn from "@/features/leads/components/PipelineColumn";
import { useUpdateLeadStatus } from "@/features/leads/hooks/useLeadMutations";
import { usePipeline } from "@/features/leads/hooks/usePipeline";
import {
  LEAD_STATUS_ORDER,
  type Lead,
  type LeadStatus,
} from "@/features/leads/types";

export default function LeadsPipelinePage() {
  const { data: pipeline = [], isLoading, isError } = usePipeline();
  const updateStatus = useUpdateLeadStatus();

  const board = useMemo(() => {
    const empty: Record<LeadStatus, Lead[]> = {
      New: [],
      Contacted: [],
      Interested: [],
      Negotiating: [],
      Won: [],
      Lost: [],
    };

    for (const column of pipeline) {
      if (column.status in empty) {
        empty[column.status] = column.leads;
      }
    }

    return empty;
  }, [pipeline]);

  const totals = useMemo(() => {
    const values = {} as Record<LeadStatus, number>;

    for (const status of LEAD_STATUS_ORDER) {
      values[status] = board[status].reduce((sum, lead) => sum + (lead.budget ?? 0), 0);
    }

    return values;
  }, [board]);

  const onDragEnd = async (result: DropResult) => {
    const { source, destination } = result;
    if (!destination || updateStatus.isPending) {
      return;
    }

    const sourceStatus = source.droppableId as LeadStatus;
    const destinationStatus = destination.droppableId as LeadStatus;

    if (
      sourceStatus === destinationStatus &&
      source.index === destination.index
    ) {
      return;
    }

    const movedLead = board[sourceStatus][source.index];
    if (!movedLead) {
      return;
    }

    await updateStatus.mutateAsync({
      id: movedLead.id,
      status: destinationStatus,
      sourceStatus,
      sourceIndex: source.index,
      destinationStatus,
      destinationIndex: destination.index,
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leads Pipeline</h1>
          <p className="text-sm text-slate-500">Drag and drop leads across sales stages.</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-56 animate-pulse rounded-xl bg-slate-200" />
            ))}
          </div>
        ) : null}

        {!isLoading && isError ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            Failed to load pipeline.
          </div>
        ) : null}

        {!isLoading && !isError ? (
          <DragDropContext onDragEnd={(result) => void onDragEnd(result)}>
            <div className="flex gap-6 overflow-x-auto p-6">
              {LEAD_STATUS_ORDER.map((status) => (
                <PipelineColumn
                  key={status}
                  status={status}
                  leads={board[status]}
                  budgetTotal={totals[status]}
                  dragDisabled={updateStatus.isPending}
                />
              ))}
            </div>
          </DragDropContext>
        ) : null}
      </div>
    </AdminLayout>
  );
}
