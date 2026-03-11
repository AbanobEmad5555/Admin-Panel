import Input from "@/components/ui/Input";
import type { EmploymentType, TeamSort, TeamStatus, TeamRole } from "@/features/team/types";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

export type EmployeesFilterState = {
  search: string;
  role: TeamRole | "";
  status: TeamStatus | "";
  employmentType: EmploymentType | "";
  sort: TeamSort;
};

type EmployeesFiltersBarProps = {
  value: EmployeesFilterState;
  onChange: (next: EmployeesFilterState) => void;
  onApply: () => void;
  onClear: () => void;
};

export default function EmployeesFiltersBar({
  value,
  onChange,
  onApply,
  onClear,
}: EmployeesFiltersBarProps) {
  const { language } = useLocalization();

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Input
          value={value.search}
          placeholder={language === "ar" ? "ابحث بالاسم أو كود الموظف" : "Search name or employee code"}
          onChange={(event) => onChange({ ...value, search: event.target.value })}
        />
        <select
          value={value.role}
          onChange={(event) => onChange({ ...value, role: event.target.value as TeamRole | "" })}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">{language === "ar" ? "كل الأدوار" : "All roles"}</option>
          <option value="ADMIN">ADMIN</option>
          <option value="MANAGER">MANAGER</option>
          <option value="CASHIER">CASHIER</option>
          <option value="EMPLOYEE">EMPLOYEE</option>
        </select>
        <select
          value={value.status}
          onChange={(event) => onChange({ ...value, status: event.target.value as TeamStatus | "" })}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">{language === "ar" ? "كل الحالات" : "All status"}</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="SUSPENDED">SUSPENDED</option>
          <option value="VACATION">VACATION</option>
          <option value="TERMINATED">TERMINATED</option>
        </select>
        <select
          value={value.employmentType}
          onChange={(event) =>
            onChange({ ...value, employmentType: event.target.value as EmploymentType | "" })
          }
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">{language === "ar" ? "كل أنواع التوظيف" : "All employment types"}</option>
          <option value="FULL_TIME">{language === "ar" ? "دوام كامل" : "Full Time"}</option>
          <option value="PART_TIME">{language === "ar" ? "دوام جزئي" : "Part Time"}</option>
          <option value="TRAINEE">{language === "ar" ? "متدرب" : "Trainee"}</option>
        </select>
        <select
          value={value.sort}
          onChange={(event) => onChange({ ...value, sort: event.target.value as TeamSort })}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="name_asc">{language === "ar" ? "الاسم تصاعدي" : "Name Asc"}</option>
          <option value="name_desc">{language === "ar" ? "الاسم تنازلي" : "Name Desc"}</option>
          <option value="salary_asc">{language === "ar" ? "الراتب تصاعدي" : "Salary Asc"}</option>
          <option value="salary_desc">{language === "ar" ? "الراتب تنازلي" : "Salary Desc"}</option>
          <option value="rating_desc">{language === "ar" ? "التقييم تنازلي" : "Rating Desc"}</option>
        </select>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClear}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
        >
          {language === "ar" ? "مسح" : "Clear"}
        </button>
        <button
          type="button"
          onClick={onApply}
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          {language === "ar" ? "تطبيق" : "Apply"}
        </button>
      </div>
    </div>
  );
}
