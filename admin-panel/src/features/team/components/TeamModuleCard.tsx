import Link from "next/link";
import { Users } from "lucide-react";

export default function TeamModuleCard() {
  return (
    <Link
      href="/admin/team"
      className="group rounded-xl bg-white p-8 text-center shadow-sm transition duration-300 hover:scale-105 hover:shadow-lg"
    >
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 via-indigo-100 to-cyan-100">
        <Users className="h-10 w-10 text-slate-900" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900">Team</h2>
      <p className="mt-3 text-sm leading-relaxed text-slate-900">
        Manage employees, roles, documents and status.
      </p>
    </Link>
  );
}
