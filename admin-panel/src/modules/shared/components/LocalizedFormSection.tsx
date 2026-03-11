import type { ReactNode } from "react";

type LocalizedFormSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export default function LocalizedFormSection({
  title,
  description,
  children,
}: LocalizedFormSectionProps) {
  return (
    <section className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {description ? (
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
