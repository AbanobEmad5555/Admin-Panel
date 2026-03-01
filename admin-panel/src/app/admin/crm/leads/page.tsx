"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
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

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Leads Management</h1>
            <p className="text-sm text-slate-500">Track, assign, and progress your sales leads.</p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/crm/leads/new"
              className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" /> New Lead
            </Link>
          </div>
        </div>

        <FilterBar
          filters={filters}
          sources={sources}
          admins={admins}
          onFiltersChange={handleFiltersChange}
        />

        <div className="overflow-hidden rounded-xl bg-white shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    "Name",
                    "Phone",
                    "Tag",
                    "Status",
                    "Priority",
                    "Assigned Admin",
                    "Follow Up Date",
                    "Actions",
                  ].map((header) => (
                    <th
                      key={header}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {isLoading
                  ? Array.from({ length: 8 }).map((_, index) => (
                      <tr key={`skeleton-${index}`}>
                        <td colSpan={8} className="px-4 py-4">
                          <div className="h-8 animate-pulse rounded bg-slate-100" />
                        </td>
                      </tr>
                    ))
                  : null}

                {!isLoading && pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-500">
                      {isError ? "Failed to load leads." : "No leads found."}
                    </td>
                  </tr>
                ) : null}

                {!isLoading
                  ? pageRows.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">{lead.name}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{lead.phone}</td>
                        <td className="px-4 py-3 text-sm">
                          <TagBadge tag={lead.tag} />
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <StatusBadge status={lead.status} />
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <PriorityBadge priority={lead.priority} />
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          <select
                            value={lead.assignedToId ?? ""}
                            onChange={(event) =>
                              void handleAssignedAdminChange(lead.id, event.target.value)
                            }
                            disabled={assignLeadAdmin.isPending && updatingLeadId === lead.id}
                            className="min-w-[180px] rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100"
                          >
                            <option value="">Unassigned</option>
                            {admins.map((admin) => (
                              <option key={admin.id} value={admin.id}>
                                {admin.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          <input
                            type="date"
                            value={toDateInput(lead.followUpDate)}
                            onChange={(event) =>
                              void handleFollowUpDateChange(lead.id, event.target.value)
                            }
                            disabled={updateLead.isPending && updatingFollowUpLeadId === lead.id}
                            className="min-w-[150px] rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/admin/crm/leads/${lead.id}`}
                              className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 transition hover:bg-slate-100"
                            >
                              View
                            </Link>
                            <Link
                              href={`/admin/crm/leads/${lead.id}?mode=edit`}
                              className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 transition hover:bg-slate-100"
                            >
                              Edit
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  : null}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
            <p className="text-xs text-slate-500">
              Showing {showingFrom} - {showingTo} of {filteredLeads.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={safePage <= 1}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-xs text-slate-600">
                Page {safePage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={safePage >= totalPages}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
