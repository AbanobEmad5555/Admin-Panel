"use client";

import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import Button from "@/components/ui/Button";
import { leadSchema, type LeadFormValues } from "@/features/leads/schemas/leadSchema";
import {
  LEAD_PRIORITIES,
  LEAD_STATUS_ORDER,
  LEAD_TAGS,
  type Lead,
  type LeadPayload,
  type User,
} from "@/features/leads/types";

type LeadFormProps = {
  initialLead?: Lead;
  users: User[];
  submitting: boolean;
  onSubmit: (payload: LeadPayload) => Promise<void>;
  showCustomerLinking?: boolean;
  showStatusField?: boolean;
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

export default function LeadForm({
  initialLead,
  users,
  submitting,
  onSubmit,
  showCustomerLinking = true,
  showStatusField = true,
}: LeadFormProps) {
  const defaultValues: LeadFormValues = useMemo(
    () => ({
      name: initialLead?.name ?? "",
      phone: initialLead?.phone ?? "",
      email: initialLead?.email ?? "",
      source: initialLead?.source ?? "",
      status: initialLead?.status ?? "New",
      priority: initialLead?.priority ?? "Medium",
      assignedToId: initialLead?.assignedToId,
      budget: initialLead?.budget,
      notes: initialLead?.notes ?? "",
      followUpDate: toDateInput(initialLead?.followUpDate),
      skipCustomerLinkValidation: !showCustomerLinking,
      customerLinkType: showCustomerLinking
        ? initialLead?.userId
          ? "existing"
          : "temp"
        : "existing",
      userId: initialLead?.userId,
      tempName: "",
      tempPhone: "",
      tempEmail: "",
      tagOverride: initialLead?.tagOverride ?? false,
      tag: initialLead?.tag,
    }),
    [initialLead, showCustomerLinking]
  );

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues,
  });

  const customerLinkType = useWatch({ control, name: "customerLinkType" });
  const tagOverride = useWatch({ control, name: "tagOverride" });

  const submit = async (values: LeadFormValues) => {
    const payload: LeadPayload = {
      name: values.name.trim(),
      phone: values.phone.trim(),
      email: values.email ? values.email.trim() : undefined,
      source: values.source.trim(),
      status: values.status,
      priority: values.priority,
      assignedToId: values.assignedToId,
      budget: values.budget,
      notes: values.notes?.trim() || undefined,
      followUpDate: values.followUpDate || undefined,
      tagOverride: values.tagOverride,
      tag: values.tagOverride ? values.tag : undefined,
    };

    if (showCustomerLinking) {
      payload.userId = values.customerLinkType === "existing" ? values.userId : undefined;
      payload.tempUser =
        values.customerLinkType === "temp"
          ? {
              tempName: values.tempName?.trim() || "",
              tempPhone: values.tempPhone?.trim() || "",
              tempEmail: values.tempEmail?.trim() || undefined,
            }
          : undefined;
    }

    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6 rounded-xl bg-white p-6 shadow">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
          <input
            {...register("name")}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          {errors.name ? <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
          <input
            {...register("phone")}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          {errors.phone ? <p className="mt-1 text-xs text-rose-600">{errors.phone.message}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
          <input
            {...register("email")}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          {errors.email ? <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Source</label>
          <input
            {...register("source")}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          {errors.source ? <p className="mt-1 text-xs text-rose-600">{errors.source.message}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Priority</label>
          <select
            {...register("priority")}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {LEAD_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </div>

        {showStatusField ? (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
            <select
              {...register("status")}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              {LEAD_STATUS_ORDER.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Assigned Admin</label>
          <select
            {...register("assignedToId", {
              setValueAs: (value) => (value ? Number(value) : undefined),
            })}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Unassigned</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Budget</label>
          <input
            type="number"
            min="0"
            step="0.01"
            {...register("budget", {
              setValueAs: (value) => (value === "" ? undefined : Number(value)),
            })}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Follow Up Date</label>
          <input
            type="date"
            {...register("followUpDate")}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          {errors.followUpDate ? (
            <p className="mt-1 text-xs text-rose-600">{errors.followUpDate.message}</p>
          ) : null}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
        <textarea
          rows={4}
          {...register("notes")}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      {showCustomerLinking ? (
        <div className="rounded-lg border border-slate-200 p-4">
          <p className="mb-3 text-sm font-semibold text-slate-900">Customer Linking</p>

          <div className="mb-4 flex flex-wrap gap-4">
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input type="radio" value="existing" {...register("customerLinkType")} />
              Select Existing User
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input type="radio" value="temp" {...register("customerLinkType")} />
              Create Temp User
            </label>
          </div>

          {customerLinkType === "existing" ? (
            <div>
              <select
                {...register("userId", {
                  setValueAs: (value) => (value ? Number(value) : undefined),
                })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Select user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
              {errors.userId ? <p className="mt-1 text-xs text-rose-600">{errors.userId.message}</p> : null}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <input
                  {...register("tempName")}
                  placeholder="Temp Name"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                {errors.tempName ? <p className="mt-1 text-xs text-rose-600">{errors.tempName.message}</p> : null}
              </div>
              <div>
                <input
                  {...register("tempPhone")}
                  placeholder="Temp Phone"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                {errors.tempPhone ? (
                  <p className="mt-1 text-xs text-rose-600">{errors.tempPhone.message}</p>
                ) : null}
              </div>
              <div>
                <input
                  {...register("tempEmail")}
                  placeholder="Temp Email"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                {errors.tempEmail ? (
                  <p className="mt-1 text-xs text-rose-600">{errors.tempEmail.message}</p>
                ) : null}
              </div>
            </div>
          )}
        </div>
      ) : null}

      <div className="rounded-lg border border-slate-200 p-4">
        <p className="mb-3 text-sm font-semibold text-slate-900">Tag</p>

        <label className="mb-3 inline-flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" {...register("tagOverride")} />
          Override Auto Tag
        </label>

        <select
          {...register("tag")}
          disabled={!tagOverride}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
        >
          <option value="">Select Tag</option>
          {LEAD_TAGS.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>

        {errors.tag ? <p className="mt-1 text-xs text-rose-600">{errors.tag.message}</p> : null}

        {!tagOverride ? (
          <p className="mt-2 text-xs text-slate-500">
            Tag will be calculated automatically based on orders
          </p>
        ) : null}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Save Lead"}
        </Button>
      </div>
    </form>
  );
}
