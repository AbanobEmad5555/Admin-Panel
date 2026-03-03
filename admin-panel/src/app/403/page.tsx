import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">403 - Access Denied</h1>
        <p className="mt-2 text-sm text-slate-600">
          You do not have permission to view this page.
        </p>
        <Link
          href="/admin"
          className="mt-6 inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Go to Admin Home
        </Link>
      </section>
    </main>
  );
}

