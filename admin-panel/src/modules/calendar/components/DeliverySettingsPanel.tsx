"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { X } from "lucide-react";
import Button from "@/components/ui/Button";
import {
  deliverySettingsSchema,
  type DeliverySettingsFormValues,
} from "@/modules/calendar/schemas/deliverySettingsSchema";
import type { DeliverySettings } from "@/modules/calendar/types/calendar.types";

type DeliverySettingsPanelProps = {
  isOpen: boolean;
  isLoading: boolean;
  isSaving: boolean;
  settings: DeliverySettings | undefined;
  errorMessage: string | null;
  onClose: () => void;
  onSubmit: (payload: DeliverySettingsFormValues) => Promise<void>;
};

const emptyValues: DeliverySettingsFormValues = {
  defaultDeliveryMethod: "STANDARD",
  STANDARD: {
    deliveryDays: 3,
    deliveryCost: 0,
  },
  EXPRESS: {
    deliveryDays: 1,
    deliveryCost: 0,
  },
};

export default function DeliverySettingsPanel({
  isOpen,
  isLoading,
  isSaving,
  settings,
  errorMessage,
  onClose,
  onSubmit,
}: DeliverySettingsPanelProps) {
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<DeliverySettingsFormValues>({
    resolver: zodResolver(deliverySettingsSchema),
    defaultValues: settings ?? emptyValues,
  });

  useEffect(() => {
    reset(settings ?? emptyValues);
  }, [reset, settings, isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close delivery settings panel"
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />

      <aside className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto border-l border-slate-200 bg-white p-5 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Delivery Settings</h2>
            <p className="text-sm text-slate-500">Configure standard and express methods.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <div className="h-9 animate-pulse rounded bg-slate-200" />
            <div className="h-9 animate-pulse rounded bg-slate-200" />
            <div className="h-9 animate-pulse rounded bg-slate-200" />
          </div>
        ) : (
          <form
            className="space-y-5"
            onSubmit={handleSubmit(async (values) => onSubmit(values))}
          >
            {errorMessage ? (
              <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {errorMessage}
              </p>
            ) : null}

            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">
                Default Delivery Method
              </label>
              <select
                {...register("defaultDeliveryMethod")}
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              >
                <option value="STANDARD">STANDARD</option>
                <option value="EXPRESS">EXPRESS</option>
              </select>
            </div>

            <div className="rounded-lg border border-slate-200 p-3">
              <h3 className="text-sm font-semibold text-slate-900">STANDARD</h3>
              <div className="mt-3 grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <label className="block text-sm text-slate-700">Delivery Days</label>
                  <input
                    type="number"
                    min={0}
                    {...register("STANDARD.deliveryDays", { valueAsNumber: true })}
                    className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                  {errors.STANDARD?.deliveryDays ? (
                    <p className="text-xs text-rose-600">
                      {errors.STANDARD.deliveryDays.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-1">
                  <label className="block text-sm text-slate-700">Delivery Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    {...register("STANDARD.deliveryCost", { valueAsNumber: true })}
                    className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                  {errors.STANDARD?.deliveryCost ? (
                    <p className="text-xs text-rose-600">
                      {errors.STANDARD.deliveryCost.message}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 p-3">
              <h3 className="text-sm font-semibold text-slate-900">EXPRESS</h3>
              <div className="mt-3 grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <label className="block text-sm text-slate-700">Delivery Days</label>
                  <input
                    type="number"
                    min={0}
                    {...register("EXPRESS.deliveryDays", { valueAsNumber: true })}
                    className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                  {errors.EXPRESS?.deliveryDays ? (
                    <p className="text-xs text-rose-600">
                      {errors.EXPRESS.deliveryDays.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-1">
                  <label className="block text-sm text-slate-700">Delivery Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    {...register("EXPRESS.deliveryCost", { valueAsNumber: true })}
                    className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                  {errors.EXPRESS?.deliveryCost ? (
                    <p className="text-xs text-rose-600">
                      {errors.EXPRESS.deliveryCost.message}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
                Close
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Apply Settings"}
              </Button>
            </div>
          </form>
        )}
      </aside>
    </div>
  );
}
