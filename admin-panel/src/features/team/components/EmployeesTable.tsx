import Link from "next/link";
import { Eye, FileText, History, Pencil, UserRoundX } from "lucide-react";
import { formatEGP } from "@/lib/currency";
import StatusBadge from "@/features/team/components/StatusBadge";
import type { Employee } from "@/features/team/types";

type EmployeesTableProps = {
  rows: Employee[];
  onEdit: (row: Employee) => void;
  onChangeStatus: (row: Employee) => void;
};

export default function EmployeesTable({ rows, onEdit, onChangeStatus }: EmployeesTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-[1080px] w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-900">
            <tr>
              <th className="px-4 py-3 font-semibold">Employee Name</th>
              <th className="px-4 py-3 font-semibold">Employee ID</th>
              <th className="px-4 py-3 font-semibold">Code</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Employment Type</th>
              <th className="px-4 py-3 font-semibold">Department</th>
              <th className="px-4 py-3 font-semibold">Shift Hours</th>
              <th className="px-4 py-3 font-semibold">Start Date</th>
              <th className="px-4 py-3 font-semibold">Salary</th>
              <th className="px-4 py-3 font-semibold">Rating</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.map((row) => (
              <tr key={row.id} className="text-slate-900">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{row.fullName}</div>
                  <div className="text-xs text-slate-700">{row.email || "-"}</div>
                </td>
                <td className="px-4 py-3">{row.id || "Auto"}</td>
                <td className="px-4 py-3">{row.employeeCode || `AUTO-${row.id.slice(0, 6)}`}</td>
                <td className="px-4 py-3">{row.role}</td>
                <td className="px-4 py-3">
                  {row.employmentType ? row.employmentType.replace("_", " ") : "-"}
                </td>
                <td className="px-4 py-3">{row.department || "Unassigned"}</td>
                <td className="px-4 py-3">
                  {row.shiftStart && row.shiftEnd ? `${row.shiftStart} - ${row.shiftEnd}` : "-"}
                </td>
                <td className="px-4 py-3">{row.hireDate || "-"}</td>
                <td className="px-4 py-3">{formatEGP(row.salary)}</td>
                <td className="px-4 py-3">
                  {typeof row.rating === "number" && row.rating > 0 ? row.rating.toFixed(1) : "-"}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/admin/team/${row.id}`}
                      className="rounded-md border border-slate-200 p-2 text-slate-700 hover:bg-slate-100"
                      aria-label={`View profile for ${row.fullName}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      className="rounded-md border border-slate-200 p-2 text-slate-700 hover:bg-slate-100"
                      onClick={() => onEdit(row)}
                      aria-label={`Edit ${row.fullName}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <Link
                      href={`/admin/team/${row.id}?tab=documents`}
                      className="rounded-md border border-slate-200 p-2 text-slate-700 hover:bg-slate-100"
                      aria-label={`Open documents for ${row.fullName}`}
                    >
                      <FileText className="h-4 w-4" />
                    </Link>
                    <Link
                      href={`/admin/team/${row.id}?tab=audit`}
                      className="rounded-md border border-slate-200 p-2 text-slate-700 hover:bg-slate-100"
                      aria-label={`Open audit logs for ${row.fullName}`}
                    >
                      <History className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      className="rounded-md border border-amber-200 p-2 text-amber-700 hover:bg-amber-50"
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
      </div>
    </div>
  );
}
