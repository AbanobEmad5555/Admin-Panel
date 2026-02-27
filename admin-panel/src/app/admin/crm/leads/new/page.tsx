"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/layout/AdminLayout";
import LeadForm from "@/features/leads/components/LeadForm";
import { useCreateLead } from "@/features/leads/hooks/useLeadMutations";
import { useLeads } from "@/features/leads/hooks/useLeads";
import type { LeadPayload, User } from "@/features/leads/types";

export default function CreateLeadPage() {
  const router = useRouter();
  const createLead = useCreateLead();
  const { data: leads = [] } = useLeads({});

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
    await createLead.mutateAsync(payload);
    router.push("/admin/crm/leads");
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Create Lead</h1>
          <p className="text-sm text-slate-500">Add a new lead and assign ownership.</p>
        </div>

        <LeadForm
          users={users}
          submitting={createLead.isPending}
          onSubmit={handleSubmit}
        />
      </div>
    </AdminLayout>
  );
}
