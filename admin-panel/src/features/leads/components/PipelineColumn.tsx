import { Draggable, Droppable } from "@hello-pangea/dnd";
import LeadCard from "@/features/leads/components/LeadCard";
import type { Lead, LeadStatus } from "@/features/leads/types";

type PipelineColumnProps = {
  status: LeadStatus;
  leads: Lead[];
  budgetTotal: number;
  dragDisabled: boolean;
};

const formatBudget = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export default function PipelineColumn({
  status,
  leads,
  budgetTotal,
  dragDisabled,
}: PipelineColumnProps) {
  return (
    <Droppable droppableId={status} isDropDisabled={dragDisabled}>
      {(dropProvided, dropSnapshot) => (
        <section
          ref={dropProvided.innerRef}
          {...dropProvided.droppableProps}
          className={`w-[350px] shrink-0 rounded-xl bg-gray-50 p-4 ${dropSnapshot.isDraggingOver ? "ring-2 ring-slate-300" : ""}`}
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">{status}</h2>
              <p className="mt-1 text-xs text-slate-500">
                {leads.length} lead{leads.length === 1 ? "" : "s"}
              </p>
            </div>
            <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
              {formatBudget(budgetTotal)}
            </span>
          </div>

          <div className="space-y-3">
            {leads.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-6 text-center text-sm text-slate-500">
                No leads in this stage.
              </div>
            ) : null}

            {leads.map((lead, index) => (
              <Draggable
                key={lead.id}
                draggableId={String(lead.id)}
                index={index}
                isDragDisabled={dragDisabled}
              >
                {(dragProvided, dragSnapshot) => (
                  <LeadCard
                    lead={lead}
                    innerRef={dragProvided.innerRef}
                    draggableProps={dragProvided.draggableProps}
                    dragHandleProps={dragProvided.dragHandleProps}
                    isDragging={dragSnapshot.isDragging}
                  />
                )}
              </Draggable>
            ))}

            {dropProvided.placeholder}
          </div>
        </section>
      )}
    </Droppable>
  );
}
