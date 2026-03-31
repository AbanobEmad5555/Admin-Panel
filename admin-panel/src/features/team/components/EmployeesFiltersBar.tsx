import Button from "@/components/ui/Button";
import GradientCard from "@/components/ui/GradientCard";
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
  const text =
    language === "ar"
      ? {
          search: "ابحث بالاسم أو كود الموظف",
          allRoles: "كل الأدوار",
          allStatus: "كل الحالات",
          allEmploymentTypes: "كل أنواع التوظيف",
          fullTime: "دوام كامل",
          partTime: "دوام جزئي",
          trainee: "متدرب",
          nameAsc: "الاسم تصاعدي",
          nameDesc: "الاسم تنازلي",
          salaryAsc: "الراتب تصاعدي",
          salaryDesc: "الراتب تنازلي",
          ratingDesc: "التقييم تنازلي",
          clear: "مسح",
          apply: "تطبيق",
        }
      : {
          search: "Search name or employee code",
          allRoles: "All roles",
          allStatus: "All status",
          allEmploymentTypes: "All employment types",
          fullTime: "Full Time",
          partTime: "Part Time",
          trainee: "Trainee",
          nameAsc: "Name Asc",
          nameDesc: "Name Desc",
          salaryAsc: "Salary Asc",
          salaryDesc: "Salary Desc",
          ratingDesc: "Rating Desc",
          clear: "Clear",
          apply: "Apply",
        };

  return (
    <GradientCard padding="md">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Input
          value={value.search}
          placeholder={text.search}
          onChange={(event) => onChange({ ...value, search: event.target.value })}
        />
        <select
          value={value.role}
          onChange={(event) => onChange({ ...value, role: event.target.value as TeamRole | "" })}
          className="px-3 py-2.5 text-sm"
        >
          <option value="">{text.allRoles}</option>
          <option value="ADMIN">ADMIN</option>
          <option value="MANAGER">MANAGER</option>
          <option value="CASHIER">CASHIER</option>
          <option value="EMPLOYEE">EMPLOYEE</option>
        </select>
        <select
          value={value.status}
          onChange={(event) => onChange({ ...value, status: event.target.value as TeamStatus | "" })}
          className="px-3 py-2.5 text-sm"
        >
          <option value="">{text.allStatus}</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="SUSPENDED">SUSPENDED</option>
          <option value="VACATION">VACATION</option>
          <option value="TERMINATED">TERMINATED</option>
        </select>
        <select
          value={value.employmentType}
          onChange={(event) => onChange({ ...value, employmentType: event.target.value as EmploymentType | "" })}
          className="px-3 py-2.5 text-sm"
        >
          <option value="">{text.allEmploymentTypes}</option>
          <option value="FULL_TIME">{text.fullTime}</option>
          <option value="PART_TIME">{text.partTime}</option>
          <option value="TRAINEE">{text.trainee}</option>
        </select>
        <select
          value={value.sort}
          onChange={(event) => onChange({ ...value, sort: event.target.value as TeamSort })}
          className="px-3 py-2.5 text-sm"
        >
          <option value="name_asc">{text.nameAsc}</option>
          <option value="name_desc">{text.nameDesc}</option>
          <option value="salary_asc">{text.salaryAsc}</option>
          <option value="salary_desc">{text.salaryDesc}</option>
          <option value="rating_desc">{text.ratingDesc}</option>
        </select>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onClear}>
          {text.clear}
        </Button>
        <Button type="button" onClick={onApply}>
          {text.apply}
        </Button>
      </div>
    </GradientCard>
  );
}
