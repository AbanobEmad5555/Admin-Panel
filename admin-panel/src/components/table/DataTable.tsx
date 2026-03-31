import type { ReactNode } from "react";
import GlassTable from "@/components/ui/GlassTable";

type Column<T> = {
  key: keyof T;
  header: string;
  render?: (value: T[keyof T], row: T) => ReactNode;
};

type DataTableProps<T> = {
  columns: Array<Column<T>>;
  rows: Array<T>;
};

export default function DataTable<T>({ columns, rows }: DataTableProps<T>) {
  return (
    <GlassTable>
      <table className="w-full text-left text-sm text-slate-200">
        <thead className="bg-white/6 text-slate-400">
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em]"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="text-slate-200 transition hover:bg-white/6">
              {columns.map((column) => (
                <td key={String(column.key)} className="px-4 py-3">
                  {column.render
                    ? column.render(row[column.key], row)
                    : String(row[column.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </GlassTable>
  );
}
