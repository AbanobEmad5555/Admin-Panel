import { ExternalLink, Trash2 } from "lucide-react";
import type { EmployeeDocument } from "@/features/team/types";

type DocumentsTableProps = {
  rows: EmployeeDocument[];
  onDelete: (document: EmployeeDocument) => void;
};

export default function DocumentsTable({ rows, onDelete }: DocumentsTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-[720px] w-full text-left text-sm text-slate-950">
          <thead className="bg-slate-50 text-slate-950">
            <tr>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Title</th>
              <th className="px-4 py-3 font-semibold">Expires At</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.map((doc) => (
              <tr key={doc.id} className="transition-colors hover:bg-slate-50/70">
                <td className="px-4 py-3 font-medium text-slate-950">{doc.type}</td>
                <td className="px-4 py-3 text-slate-950">{doc.title}</td>
                <td className="px-4 py-3 text-slate-900">{doc.expiresAt || "-"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-md border border-slate-300 p-2 text-slate-900 hover:bg-slate-100"
                      aria-label={`Open ${doc.title}`}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() => onDelete(doc)}
                      className="rounded-md border border-rose-200 p-2 text-rose-600 hover:bg-rose-50"
                      aria-label={`Delete ${doc.title}`}
                    >
                      <Trash2 className="h-4 w-4" />
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
