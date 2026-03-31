import type { ChangeEvent } from "react";
import GradientCard from "@/components/ui/GradientCard";
import Input from "@/components/ui/Input";
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
    <GradientCard padding="md">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
        <Input
          value={filters.search ?? ""}
          onChange={updateField("search")}
          placeholder={language === "ar" ? "ابحث بالاسم أو الهاتف" : "Search by name or phone"}
        />

        <select
          value={filters.status ?? ""}
          onChange={updateField("status")}
          className="glass-input rounded-xl border border-white/10 bg-white/6 px-3 py-2.5 text-sm text-slate-50 outline-none focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-400/20"
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
          className="glass-input rounded-xl border border-white/10 bg-white/6 px-3 py-2.5 text-sm text-slate-50 outline-none focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-400/20"
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
          className="glass-input rounded-xl border border-white/10 bg-white/6 px-3 py-2.5 text-sm text-slate-50 outline-none focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-400/20"
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
          className="glass-input rounded-xl border border-white/10 bg-white/6 px-3 py-2.5 text-sm text-slate-50 outline-none focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-400/20"
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
          className="glass-input rounded-xl border border-white/10 bg-white/6 px-3 py-2.5 text-sm text-slate-50 outline-none focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-400/20"
        >
          <option value="">{language === "ar" ? "كل المصادر" : "All Sources"}</option>
          {sources.map((source) => (
            <option key={source} value={source}>
              {source}
            </option>
          ))}
        </select>
      </div>
    </GradientCard>
  );
}
