import Link from "next/link";
import { Eye, FileText, History, Pencil, UserRoundX } from "lucide-react";
import Badge from "@/components/ui/Badge";
import GlassTable from "@/components/ui/GlassTable";
import { formatEGP } from "@/lib/currency";
import StatusBadge from "@/features/team/components/StatusBadge";
import type { Employee } from "@/features/team/types";
import { useLocalization } from "@/modules/localization/LocalizationProvider";
import LocalizedDisplayText from "@/modules/shared/components/LocalizedDisplayText";

type EmployeesTableProps = {
  rows: Employee[];
  canEdit?: boolean;
  onEdit: (row: Employee) => void;
  onChangeStatus: (row: Employee) => void;
};

export default function EmployeesTable({
  rows,
  canEdit = true,
  onEdit,
  onChangeStatus,
}: EmployeesTableProps) {
  const { language } = useLocalization();
  const text =
    language === "ar"
      ? {
          fullName: "الاسم الكامل",
          employeeId: "معرّف الموظف",
          code: "الكود",
          role: "الدور",
          employmentType: "نوع التوظيف",
          department: "القسم",
          shiftHours: "ساعات الوردية",
          startDate: "تاريخ البداية",
          salary: "الراتب",
          rating: "التقييم",
          employeeStatus: "حالة الموظف",
          authStatus: "حالة الحساب",
          actions: "الإجراءات",
          auto: "تلقائي",
          fullTime: "دوام كامل",
          partTime: "دوام جزئي",
          trainee: "متدرب",
          unassigned: "غير معيّن",
        }
      : {
          fullName: "Full Name",
          employeeId: "Employee ID",
          code: "Code",
          role: "Role",
          employmentType: "Employment Type",
          department: "Department",
          shiftHours: "Shift Hours",
          startDate: "Start Date",
          salary: "Salary",
          rating: "Rating",
          employeeStatus: "Employee Status",
          authStatus: "Auth Status",
          actions: "Actions",
          auto: "Auto",
          fullTime: "FULL TIME",
          partTime: "PART TIME",
          trainee: "TRAINEE",
          unassigned: "Unassigned",
        };

  return (
    <GlassTable>
      <table className={`min-w-[1200px] w-full text-sm ${language === "ar" ? "text-right" : "text-left"}`}>
        <thead className="bg-white/6 text-slate-400">
          <tr>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em]">{text.fullName}</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em]">{text.employeeId}</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em]">{text.code}</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em]">{text.role}</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em]">{text.employmentType}</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em]">{text.department}</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em]">{text.shiftHours}</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em]">{text.startDate}</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em]">{text.salary}</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em]">{text.rating}</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em]">{text.employeeStatus}</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em]">{text.authStatus}</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em]">{text.actions}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10 text-slate-200">
          {rows.map((row) => (
            <tr key={row.id} className="transition hover:bg-white/6">
              <td className="px-4 py-3">
                <div className="font-medium text-slate-50">
                  <LocalizedDisplayText
                    valueEn={row.fullNameEn}
                    valueAr={row.fullNameAr}
                    legacyValue={row.fullName}
                  />
                </div>
                <div className="text-xs text-slate-300">{row.email || "-"}</div>
                {row.authAccount?.email && row.authAccount.email !== row.email ? (
                  <div className="text-xs text-slate-500">{row.authAccount.email}</div>
                ) : null}
              </td>
              <td className="px-4 py-3">{row.id || text.auto}</td>
              <td className="px-4 py-3">{row.employeeCode || `AUTO-${row.id.slice(0, 6)}`}</td>
              <td className="px-4 py-3">{row.role}</td>
              <td className="px-4 py-3">
                {row.employmentType
                  ? row.employmentType === "FULL_TIME"
                    ? text.fullTime
                    : row.employmentType === "PART_TIME"
                      ? text.partTime
                      : text.trainee
                  : "-"}
              </td>
              <td className="px-4 py-3">
                <LocalizedDisplayText
                  valueEn={row.departmentEn}
                  valueAr={row.departmentAr}
                  legacyValue={row.department || text.unassigned}
                />
              </td>
              <td className="px-4 py-3">{row.shiftStart && row.shiftEnd ? `${row.shiftStart} - ${row.shiftEnd}` : "-"}</td>
              <td className="px-4 py-3">{row.hireDate || "-"}</td>
              <td className="px-4 py-3">{formatEGP(row.salary)}</td>
              <td className="px-4 py-3">{typeof row.rating === "number" && row.rating > 0 ? row.rating.toFixed(1) : "-"}</td>
              <td className="px-4 py-3">
                <StatusBadge status={row.status} />
              </td>
              <td className="px-4 py-3">
                {row.authAccount?.staffAccountStatus ? <Badge>{row.authAccount.staffAccountStatus}</Badge> : "-"}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  <Link
                    href={`/admin/team/${row.id}`}
                    className="rounded-xl border border-white/10 bg-white/6 p-2 text-slate-300 hover:bg-white/10 hover:text-white"
                    aria-label={`View profile for ${row.fullName}`}
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    disabled={!canEdit}
                    className="rounded-xl border border-white/10 bg-white/6 p-2 text-slate-300 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => onEdit(row)}
                    aria-label={`Edit ${row.fullName}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <Link
                    href={`/admin/team/${row.id}?tab=documents`}
                    className="rounded-xl border border-white/10 bg-white/6 p-2 text-slate-300 hover:bg-white/10 hover:text-white"
                    aria-label={`Open documents for ${row.fullName}`}
                  >
                    <FileText className="h-4 w-4" />
                  </Link>
                  <Link
                    href={`/admin/team/${row.id}?tab=audit`}
                    className="rounded-xl border border-white/10 bg-white/6 p-2 text-slate-300 hover:bg-white/10 hover:text-white"
                    aria-label={`Open audit logs for ${row.fullName}`}
                  >
                    <History className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    disabled={!canEdit}
                    className="rounded-xl border border-amber-300/20 bg-amber-500/12 p-2 text-amber-100 hover:bg-amber-500/18 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => onChangeStatus(row)}
                    aria-label={`Change status for ${row.fullName}`}
                  >
                    <UserRoundX className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </GlassTable>
  );
}
