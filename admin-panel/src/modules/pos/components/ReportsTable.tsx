"use client";

type ReportsTableProps<T extends Record<string, unknown>> = {
  columns: Array<{ key: keyof T; label: string }>;
  rows: T[];
};

export default function ReportsTable<T extends Record<string, unknown>>({
  columns,
  rows,
}: ReportsTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-slate-500">
                  No data.
                </td>
              </tr>
            ) : null}
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-slate-50/80">
                {columns.map((column) => (
                  <td key={String(column.key)} className="px-4 py-3 text-sm text-slate-700">
                    {String(row[column.key] ?? "-")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
