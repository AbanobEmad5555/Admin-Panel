"use client";

import { useEffect, useMemo, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { manualEventSchema, type ManualEventFormValues } from "@/modules/calendar/schemas/manualEventSchema";
import type {
  CalendarEventMutationPayload,
  CalendarManualEvent,
} from "@/modules/calendar/types/calendar.types";
import { DEFAULT_MANUAL_EVENT_COLOR } from "@/modules/calendar/utils/calendarColors";
import { localDateTimeInputToUtcIso } from "@/modules/calendar/utils/date";
import { manualEventToFormValues } from "@/modules/calendar/utils/calendarMappers";

type ManualEventModalProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  isDeleting: boolean;
  initialEvent: CalendarManualEvent | null;
  onClose: () => void;
  onSubmit: (payload: CalendarEventMutationPayload) => Promise<void>;
  onDelete: () => Promise<void>;
};

const defaultValues: ManualEventFormValues = {
  title: "",
  description: "",
  startDate: "",
  endDate: "",
  color: DEFAULT_MANUAL_EVENT_COLOR,
};

export default function ManualEventModal({
  isOpen,
  isSubmitting,
  isDeleting,
  initialEvent,
  onClose,
  onSubmit,
  onDelete,
}: ManualEventModalProps) {
  const startDateRef = useRef<HTMLInputElement | null>(null);
  const endDateRef = useRef<HTMLInputElement | null>(null);

  const values = useMemo(
    () => (initialEvent ? manualEventToFormValues(initialEvent) : defaultValues),
    [initialEvent],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ManualEventFormValues>({
    resolver: zodResolver(manualEventSchema),
    defaultValues: values,
  });

  useEffect(() => {
    reset(values);
  }, [reset, values, isOpen]);

  const openNativePicker = (input: HTMLInputElement | null) => {
    if (!input) {
      return;
    }
    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }
    input.focus();
  };

  const handleClose = () => {
    reset(defaultValues);
    onClose();
  };

  const submit = async (input: ManualEventFormValues) => {
    await onSubmit({
      title: input.title.trim(),
      description: input.description?.trim() || undefined,
      startDate: localDateTimeInputToUtcIso(input.startDate),
      endDate: localDateTimeInputToUtcIso(input.endDate),
      color: input.color,
    });
    reset(defaultValues);
  };

  return (
    <Modal
      title={initialEvent ? "Edit Manual Event" : "Create Manual Event"}
      isOpen={isOpen}
      onClose={handleClose}
    >
      <form className="space-y-4" onSubmit={handleSubmit((values) => submit(values))}>
        <div className="space-y-1">
          <label className="block text-sm font-semibold text-slate-900">Title</label>
          <input
            {...register("title")}
            className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            placeholder="Operational note"
          />
          {errors.title ? <p className="text-xs text-rose-600">{errors.title.message}</p> : null}
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-semibold text-slate-900">Description</label>
          <textarea
            rows={3}
            {...register("description")}
            className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            placeholder="Optional details"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-slate-900">Start Date</label>
            <input
              ref={startDateRef}
              type="datetime-local"
              {...register("startDate")}
              className="w-full cursor-pointer rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              onClick={() => openNativePicker(startDateRef.current)}
              onFocus={() => openNativePicker(startDateRef.current)}
            />
            {errors.startDate ? (
              <p className="text-xs text-rose-600">{errors.startDate.message}</p>
            ) : null}
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-semibold text-slate-900">End Date</label>
            <input
              ref={endDateRef}
              type="datetime-local"
              {...register("endDate")}
              className="w-full cursor-pointer rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              onClick={() => openNativePicker(endDateRef.current)}
              onFocus={() => openNativePicker(endDateRef.current)}
            />
            {errors.endDate ? (
              <p className="text-xs text-rose-600">{errors.endDate.message}</p>
            ) : null}
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-semibold text-slate-900">Color</label>
          <input
            type="color"
            {...register("color")}
            className="h-10 w-full rounded-md border border-slate-300 bg-slate-50 px-2"
          />
          {errors.color ? <p className="text-xs text-rose-600">{errors.color.message}</p> : null}
        </div>

        <div className="flex items-center justify-between gap-2">
          {initialEvent ? (
            <Button
              type="button"
              variant="danger"
              onClick={() => void onDelete()}
              disabled={isDeleting || isSubmitting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isSubmitting || isDeleting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isDeleting}>
              {isSubmitting ? "Saving..." : initialEvent ? "Save Changes" : "Create Event"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
