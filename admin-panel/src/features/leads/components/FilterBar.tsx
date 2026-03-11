import type { ChangeEvent } from "react";
import {
  LEAD_PRIORITIES,
  LEAD_STATUS_ORDER,
  LEAD_TAGS,
  type LeadFilters,
  type User,
} from "@/features/leads/types";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

type FilterBarProps = {
  filters: LeadFilters;
  sources: string[];
  admins: User[];
  onFiltersChange: (next: LeadFilters) => void;
};

export default function FilterBar({
  filters,
  sources,
  admins,
  onFiltersChange,
}: FilterBarProps) {
  const { language } = useLocalization();

  const updateField =
    (key: keyof LeadFilters) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      onFiltersChange({
        ...filters,
        [key]: event.target.value,
      });
    };

  return (
    <div className="rounded-xl bg-white p-4 shadow">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
        <input
          value={filters.search ?? ""}
          onChange={updateField("search")}
          placeholder={language === "ar" ? "ابحث بالاسم أو الهاتف" : "Search by name or phone"}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-400"
        />

        <select
          value={filters.status ?? ""}
          onChange={updateField("status")}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-0 focus:border-slate-400"
        >
          <option value="">{language === "ar" ? "كل الحالات" : "All Status"}</option>
          {LEAD_STATUS_ORDER.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <select
          value={filters.tag ?? ""}
          onChange={updateField("tag")}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-0 focus:border-slate-400"
        >
          <option value="">{language === "ar" ? "كل الوسوم" : "All Tags"}</option>
          {LEAD_TAGS.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>

        <select
          value={filters.priority ?? ""}
          onChange={updateField("priority")}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-0 focus:border-slate-400"
        >
          <option value="">{language === "ar" ? "كل الأولويات" : "All Priorities"}</option>
          {LEAD_PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </select>

        <select
          value={filters.assignedTo ?? ""}
          onChange={updateField("assignedTo")}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-0 focus:border-slate-400"
        >
          <option value="">{language === "ar" ? "كل المسؤولين" : "All Admins"}</option>
          {admins.map((admin) => (
            <option key={admin.id} value={String(admin.id)}>
              {admin.name}
            </option>
          ))}
        </select>

        <select
          value={filters.source ?? ""}
          onChange={updateField("source")}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-0 focus:border-slate-400"
        >
          <option value="">{language === "ar" ? "كل المصادر" : "All Sources"}</option>
          {sources.map((source) => (
            <option key={source} value={source}>
              {source}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
