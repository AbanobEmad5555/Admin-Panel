import type {
  DraggableProvidedDragHandleProps,
  DraggableProvidedDraggableProps,
} from "@hello-pangea/dnd";
import Link from "next/link";
import { CalendarDays, Phone } from "lucide-react";
import PriorityBadge from "@/features/leads/components/PriorityBadge";
import TagBadge from "@/features/leads/components/TagBadge";
import type { Lead } from "@/features/leads/types";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

type LeadCardProps = {
  lead: Lead;
  innerRef?: (element: HTMLDivElement | null) => void;
  draggableProps?: DraggableProvidedDraggableProps;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  isDragging?: boolean;
};

const formatDate = (value?: string) => {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function LeadCard({
  lead,
  innerRef,
  draggableProps,
  dragHandleProps,
  isDragging = false,
}: LeadCardProps) {
  const { language } = useLocalization();
  const text =
    language === "ar"
      ? {
          unassigned: "غير معيّن",
          followUp: "المتابعة",
          view: "عرض",
        }
      : {
          unassigned: "Unassigned",
          followUp: "Follow up",
          view: "View",
        };
  return (
    <div
      ref={innerRef}
      {...draggableProps}
      {...dragHandleProps}
      className={`rounded-xl bg-white p-4 shadow transition hover:shadow-lg ${isDragging ? "ring-2 ring-slate-300" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-900">{lead.name}</h3>
        <TagBadge tag={lead.tag} />
      </div>

      <div className="mt-2 flex items-center gap-1 text-sm text-slate-600">
        <Phone className="h-3.5 w-3.5" />
        <span>{lead.phone}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <PriorityBadge priority={lead.priority} />
        {lead.assignedTo?.id ? (
          <Link
            href={`/admin/users/${lead.assignedTo.id}`}
            className="text-xs font-medium text-blue-700 hover:underline"
          >
            {lead.assignedTo.name}
          </Link>
        ) : (
          <span className="text-xs text-slate-500">{lead.assignedTo?.name ?? text.unassigned}</span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-1 text-xs text-slate-500">
        <CalendarDays className="h-3.5 w-3.5" />
        <span>{text.followUp}: {formatDate(lead.followUpDate)}</span>
      </div>

      <div className="mt-4">
        <Link
          href={`/admin/crm/leads/${lead.id}`}
          className="inline-flex rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
        >
          {text.view}
        </Link>
      </div>
    </div>
  );
}
