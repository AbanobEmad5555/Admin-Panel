"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import Button from "@/components/ui/Button";
import GlassTable from "@/components/ui/GlassTable";
import PageHeader from "@/components/ui/PageHeader";
import FilterBar from "@/features/leads/components/FilterBar";
import PriorityBadge from "@/features/leads/components/PriorityBadge";
import StatusBadge from "@/features/leads/components/StatusBadge";
import TagBadge from "@/features/leads/components/TagBadge";
import { useLeadAdmins } from "@/features/leads/hooks/useLeadAdmins";
import { useAssignLeadAdmin, useUpdateLead } from "@/features/leads/hooks/useLeadMutations";
import { useLeads } from "@/features/leads/hooks/useLeads";
import type {
  Lead,
  LeadFilters,
  User,
} from "@/features/leads/types";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

const PAGE_SIZE = 10;

const matchesSearch = (lead: Lead, search: string) => {
  const term = search.trim().toLowerCase();
  if (!term) {
    return true;
  }

  return (
    lead.name.toLowerCase().includes(term) ||
    lead.phone.toLowerCase().includes(term)
  );
};

const toDateInput = (value?: string) => {
  if (!value) {
    return "";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  return parsed.toISOString().slice(0, 10);
};

export default function LeadsListPage() {
  const { language } = useLocalization();
  const [filters, setFilters] = useState<LeadFilters>({
    search: "",
    status: "",
    tag: "",
    priority: "",
    assignedTo: "",
    source: "",
  });
  const [page, setPage] = useState(1);

  const serverFilters = useMemo(
    () => ({
      status: filters.status,
      tag: filters.tag,
      assignedTo: filters.assignedTo,
      source: filters.source,
    }),
    [filters.assignedTo, filters.source, filters.status, filters.tag]
  );

  const { data: leads = [], isLoading, isError } = useLeads(serverFilters);
  const { data: allAdmins = [] } = useLeadAdmins();
  const assignLeadAdmin = useAssignLeadAdmin();
  const updateLead = useUpdateLead();
  const [updatingLeadId, setUpdatingLeadId] = useState<number | null>(null);
  const [updatingFollowUpLeadId, setUpdatingFollowUpLeadId] = useState<number | null>(null);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (!matchesSearch(lead, filters.search ?? "")) {
        return false;
      }

      if (filters.priority && lead.priority !== filters.priority) {
        return false;
      }

      return true;
    });
  }, [filters.priority, filters.search, leads]);

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const pageRows = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredLeads.slice(start, start + PAGE_SIZE);
  }, [filteredLeads, safePage]);

  const adminsFromLeads = useMemo<User[]>(() => {
    const map = new Map<number, User>();

    for (const lead of leads) {
      if (lead.assignedTo && !map.has(lead.assignedTo.id)) {
        map.set(lead.assignedTo.id, lead.assignedTo);
      }
    }

    return Array.from(map.values());
  }, [leads]);

  const admins = useMemo<User[]>(() => {
    if (allAdmins.length > 0) {
      return allAdmins;
    }
    return adminsFromLeads;
  }, [adminsFromLeads, allAdmins]);

  const sources = useMemo(() => {
    return Array.from(new Set(leads.map((lead) => lead.source).filter(Boolean))).sort();
  }, [leads]);

  const handleFiltersChange = (next: LeadFilters) => {
    setPage(1);
    setFilters(next);
  };

  const handleAssignedAdminChange = async (leadId: number, value: string) => {
    if (!value) {
      return;
    }

    setUpdatingLeadId(leadId);
    try {
      await assignLeadAdmin.mutateAsync({
        leadId,
        adminId: Number(value),
      });
    } finally {
      setUpdatingLeadId(null);
    }
  };

  const handleFollowUpDateChange = async (leadId: number, value: string) => {
    setUpdatingFollowUpLeadId(leadId);
    try {
      await updateLead.mutateAsync({
        id: leadId,
        payload: {
          followUpDate: value || undefined,
        },
      });
    } finally {
      setUpdatingFollowUpLeadId(null);
    }
  };

  const showingFrom = filteredLeads.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(safePage * PAGE_SIZE, filteredLeads.length);

  const text =
    language === "ar"
      ? {
          title: "إدارة العملاء المحتملين",
          subtitle: "تابع العملاء المحتملين وعيّنهم وحرّكهم خلال مراحل البيع.",
          newLead: "عميل محتمل جديد",
          name: "الاسم",
          phone: "الهاتف",
          tag: "الوسم",
          status: "الحالة",
          priority: "الأولوية",
          assignedAdmin: "المسؤول المعيّن",
          followUpDate: "تاريخ المتابعة",
          actions: "الإجراءات",
          unassigned: "غير معيّن",
          view: "عرض",
          edit: "تعديل",
          empty: "لا يوجد عملاء محتملون.",
          loadError: "فشل تحميل العملاء المحتملين.",
          showing: `عرض ${showingFrom} - ${showingTo} من ${filteredLeads.length}`,
          previous: "السابق",
          next: "التالي",
          page: `الصفحة ${safePage} / ${totalPages}`,
        }
      : {
          title: "Leads Management",
          subtitle: "Track, assign, and progress your sales leads.",
          newLead: "New Lead",
          name: "Name",
          phone: "Phone",
          tag: "Tag",
          status: "Status",
          priority: "Priority",
          assignedAdmin: "Assigned Admin",
          followUpDate: "Follow Up Date",
          actions: "Actions",
          unassigned: "Unassigned",
          view: "View",
          edit: "Edit",
          empty: "No leads found.",
          loadError: "Failed to load leads.",
          showing: `Showing ${showingFrom} - ${showingTo} of ${filteredLeads.length}`,
          previous: "Previous",
          next: "Next",
          page: `Page ${safePage} / ${totalPages}`,
        };

  return (
    <AdminLayout requiredPermissions={["leads.view"]}>
      <div className="space-y-6">
        <PageHeader
          eyebrow="CRM"
          title={text.title}
          description={text.subtitle}
          actions={
            <Link href="/admin/crm/leads/new">
              <Button size="sm">
                <Plus className="h-4 w-4" /> {text.newLead}
              </Button>
            </Link>
          }
        />

        <FilterBar
          filters={filters}
          sources={sources}
          admins={admins}
          onFiltersChange={handleFiltersChange}
        />

        <GlassTable>
          <table className="min-w-full text-sm">
            <thead className="bg-white/[0.06]">
              <tr>
                {[
                  text.name,
                  text.phone,
                  text.tag,
                  text.status,
                  text.priority,
                  text.assignedAdmin,
                  text.followUpDate,
                  text.actions,
                ].map((header) => (
                  <th
                    key={header}
                    className={`px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 ${language === "ar" ? "text-right" : "text-left"}`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-white/10 text-slate-200">
              {isLoading
                ? Array.from({ length: 8 }).map((_, index) => (
                    <tr key={`skeleton-${index}`}>
                      <td colSpan={8} className="px-4 py-4">
                        <div className="h-10 animate-pulse rounded-2xl bg-white/8" />
                      </td>
                    </tr>
                  ))
                : null}

              {!isLoading && pageRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-300">
                    {isError ? text.loadError : text.empty}
                  </td>
                </tr>
              ) : null}

              {!isLoading
                ? pageRows.map((lead) => (
                    <tr key={lead.id} className="transition hover:bg-white/[0.04]">
                      <td className="px-4 py-3 text-sm font-medium text-slate-50">{lead.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-300">{lead.phone}</td>
                      <td className="px-4 py-3 text-sm">
                        <TagBadge tag={lead.tag} />
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <StatusBadge status={lead.status} />
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <PriorityBadge priority={lead.priority} />
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300">
                        <select
                          value={lead.assignedToId ?? ""}
                          onChange={(event) =>
                            void handleAssignedAdminChange(lead.id, event.target.value)
                          }
                          disabled={assignLeadAdmin.isPending && updatingLeadId === lead.id}
                          className="glass-input min-w-[180px] rounded-xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">{text.unassigned}</option>
                          {admins.map((admin) => (
                            <option key={admin.id} value={admin.id}>
                              {admin.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300">
                        <input
                          type="date"
                          value={toDateInput(lead.followUpDate)}
                          onChange={(event) =>
                            void handleFollowUpDateChange(lead.id, event.target.value)
                          }
                          disabled={updateLead.isPending && updatingFollowUpLeadId === lead.id}
                          className="glass-input min-w-[160px] rounded-xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Link href={`/admin/crm/leads/${lead.id}`}>
                            <Button variant="secondary" size="sm">
                              {text.view}
                            </Button>
                          </Link>
                          <Link href={`/admin/crm/leads/${lead.id}?mode=edit`}>
                            <Button variant="ghost" size="sm">
                              {text.edit}
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                : null}
            </tbody>
          </table>

          <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
            <p className="text-xs text-slate-400">{text.showing}</p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={safePage <= 1}
              >
                {text.previous}
              </Button>
              <span className="text-xs text-slate-300">{text.page}</span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={safePage >= totalPages}
              >
                {text.next}
              </Button>
            </div>
          </div>
        </GlassTable>
      </div>
    </AdminLayout>
  );
}
