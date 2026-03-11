"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import AdminLayout from "@/components/layout/AdminLayout";
import LeadForm from "@/features/leads/components/LeadForm";
import PriorityBadge from "@/features/leads/components/PriorityBadge";
import StatusBadge from "@/features/leads/components/StatusBadge";
import TagBadge from "@/features/leads/components/TagBadge";
import { useLeads } from "@/features/leads/hooks/useLeads";
import { useUpdateLead } from "@/features/leads/hooks/useLeadMutations";
import type { LeadPayload, User } from "@/features/leads/types";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

const formatDate = (value?: string) => {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function LeadDetailsPage() {
  const { language } = useLocalization();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  const mode = searchParams.get("mode") === "edit" ? "edit" : "view";
  const leadId = Number(params.id);

  const { data: leads = [], isLoading, isError } = useLeads({});
  const updateLead = useUpdateLead();
  const text =
    language === "ar"
      ? {
          title: "تفاصيل العميل المحتمل",
          subtitle: "اعرض وعدّل ملف العميل المحتمل وحالة المبيعات.",
          backToView: "العودة للعرض",
          editLead: "تعديل العميل المحتمل",
          loadFailed: "فشل تحميل العميل المحتمل.",
          notFound: "العميل المحتمل غير موجود.",
          name: "الاسم",
          phone: "الهاتف",
          email: "البريد الإلكتروني",
          assignedAdmin: "المسؤول المعيّن",
          unassigned: "غير معيّن",
          source: "المصدر",
          followUpDate: "تاريخ المتابعة",
          tagOverride: "تجاوز الوسم",
          enabled: "مفعل",
          disabled: "معطل",
          budget: "الميزانية",
          notes: "ملاحظات",
        }
      : {
          title: "Lead Details",
          subtitle: "View and edit lead profile and sales status.",
          backToView: "Back to View",
          editLead: "Edit Lead",
          loadFailed: "Failed to load lead.",
          notFound: "Lead not found.",
          name: "Name",
          phone: "Phone",
          email: "Email",
          assignedAdmin: "Assigned Admin",
          unassigned: "Unassigned",
          source: "Source",
          followUpDate: "Follow Up Date",
          tagOverride: "Tag Override",
          enabled: "Enabled",
          disabled: "Disabled",
          budget: "Budget",
          notes: "Notes",
        };

  const selectedLead = useMemo(
    () => leads.find((lead) => lead.id === leadId),
    [leadId, leads]
  );

  const users = useMemo<User[]>(() => {
    const map = new Map<number, User>();

    for (const lead of leads) {
      if (lead.assignedTo && !map.has(lead.assignedTo.id)) {
        map.set(lead.assignedTo.id, lead.assignedTo);
      }
    }

    return Array.from(map.values());
  }, [leads]);

  const handleSubmit = async (payload: LeadPayload) => {
    await updateLead.mutateAsync({ id: leadId, payload });
    router.push(`/admin/crm/leads/${leadId}`);
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{text.title}</h1>
            <p className="text-sm text-slate-500">{text.subtitle}</p>
          </div>

          {selectedLead ? (
            mode === "edit" ? (
              <Link
                href={`/admin/crm/leads/${selectedLead.id}`}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
              >
                {text.backToView}
              </Link>
            ) : (
              <Link
                href={`/admin/crm/leads/${selectedLead.id}?mode=edit`}
                className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white transition hover:bg-slate-800"
              >
                {text.editLead}
              </Link>
            )
          ) : null}
        </div>

        {isLoading ? (
          <div className="rounded-xl bg-white p-6 shadow">
            <div className="h-8 animate-pulse rounded bg-slate-100" />
          </div>
        ) : null}

        {!isLoading && (isError || !selectedLead) ? (
          <div className="rounded-xl bg-white p-6 text-sm text-slate-600 shadow">
            {isError ? text.loadFailed : text.notFound}
          </div>
        ) : null}

        {selectedLead ? (
          <>
            <div className="flex flex-wrap items-center gap-2 rounded-xl bg-white p-4 shadow">
              <TagBadge tag={selectedLead.tag} />
              <StatusBadge status={selectedLead.status} />
              <PriorityBadge priority={selectedLead.priority} />
            </div>

            {mode === "edit" ? (
              <LeadForm
                initialLead={selectedLead}
                users={users}
                submitting={updateLead.isPending}
                onSubmit={handleSubmit}
                showCustomerLinking={false}
                showStatusField={false}
              />
            ) : (
              <div className="rounded-xl bg-white p-6 shadow">
                <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">{text.name}</dt>
                    <dd className="text-sm font-medium text-slate-900">{selectedLead.name}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">{text.phone}</dt>
                    <dd className="text-sm font-medium text-slate-900">{selectedLead.phone}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">{text.email}</dt>
                    <dd className="text-sm font-medium text-slate-900">{selectedLead.email ?? "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">{text.assignedAdmin}</dt>
                    <dd className="text-sm font-medium text-slate-900">
                      {selectedLead.assignedTo?.id ? (
                        <Link
                          href={`/admin/users/${selectedLead.assignedTo.id}`}
                          className="text-blue-700 hover:underline"
                        >
                          {selectedLead.assignedTo.name}
                        </Link>
                      ) : (
                        selectedLead.assignedTo?.name ?? text.unassigned
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">{text.source}</dt>
                    <dd className="text-sm font-medium text-slate-900">{selectedLead.source}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">{text.followUpDate}</dt>
                    <dd className="text-sm font-medium text-slate-900">{formatDate(selectedLead.followUpDate)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">{text.tagOverride}</dt>
                    <dd className="text-sm font-medium text-slate-900">
                      {selectedLead.tagOverride ? text.enabled : text.disabled}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-500">{text.budget}</dt>
                    <dd className="text-sm font-medium text-slate-900">
                      {typeof selectedLead.budget === "number" ? selectedLead.budget : "-"}
                    </dd>
                  </div>
                  <div className="md:col-span-2">
                    <dt className="text-xs uppercase tracking-wide text-slate-500">{text.notes}</dt>
                    <dd className="text-sm text-slate-700">{selectedLead.notes ?? "-"}</dd>
                  </div>
                </dl>
              </div>
            )}
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
}
