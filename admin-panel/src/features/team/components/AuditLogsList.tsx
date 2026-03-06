import type { EmployeeAuditLog } from "@/features/team/types";

type AuditLogsListProps = {
  rows: EmployeeAuditLog[];
};

export default function AuditLogsList({ rows }: AuditLogsListProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <ul className="space-y-3">
        {rows.map((log) => (
          <li key={log.id} className="rounded-md border border-slate-200 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">{log.action}</p>
              <p className="text-xs text-slate-900">{log.createdAt || "-"}</p>
            </div>
            <p className="mt-1 text-xs text-slate-900">
              By: {log.actorName || "System"} {log.actorRole ? `(${log.actorRole})` : ""}
            </p>
            {log.details ? <p className="mt-2 text-sm text-slate-900">{log.details}</p> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
