"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "@/components/ui/Button";
import { teamApi } from "@/features/team/api/team.api";
import {
  employeeFormSchema,
  type EmployeeFormValues,
} from "@/features/team/schemas/employee.schema";
import type { Employee, EmploymentType, TeamRole, WorkingDay } from "@/features/team/types";

type EmployeeFormProps = {
  mode: "create" | "edit";
  initial?: Employee | null;
  pending?: boolean;
  onCancel: () => void;
  onSubmit: (values: EmployeeFormValues) => void | Promise<void>;
};

const dayOptions: WorkingDay[] = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const ratingOptions = Array.from({ length: 10 }, (_, index) => ((index + 1) * 0.5).toFixed(1));

const toDefaults = (employee?: Employee | null): EmployeeFormValues => ({
  firstName: employee?.firstName ?? "",
  lastName: employee?.lastName ?? "",
  role: (employee?.role as TeamRole) ?? "EMPLOYEE",
  salary: employee?.salary ?? 0,
  currency: employee?.currency ?? "EGP",
  email: employee?.email ?? "",
  phone: employee?.phone ?? "",
  address: employee?.address ?? "",
  title: employee?.title ?? "",
  employmentType: (employee?.employmentType as EmploymentType | undefined) ?? "FULL_TIME",
  department: employee?.department ?? "",
  profileImageUrl: employee?.profileImageUrl ?? "",
  hireDate: employee?.hireDate ?? "",
  shiftStart: employee?.shiftStart ?? "",
  shiftEnd: employee?.shiftEnd ?? "",
  workingDays: employee?.workingDays?.length ? employee.workingDays : ["SUN", "MON", "TUE", "WED", "THU"],
  rating: employee?.rating ?? undefined,
  notes: employee?.notes ?? "",
});

export default function EmployeeForm({
  mode,
  initial,
  pending = false,
  onCancel,
  onSubmit,
}: EmployeeFormProps) {
  const defaults = useMemo(() => toDefaults(initial), [initial]);
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: defaults,
  });
  const [imageSource, setImageSource] = useState<"link" | "file">("link");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageInputError, setImageInputError] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const selectedDays = form.watch("workingDays");

  useEffect(() => {
    form.reset(defaults);
  }, [defaults, form]);

  return (
    <form
      onSubmit={form.handleSubmit(async (values) => {
        setImageInputError("");
        let nextValues: EmployeeFormValues = values;
        if (imageSource === "file") {
          if (!imageFile) {
            setImageInputError("Please choose an image file.");
            return;
          }
          try {
            setIsUploadingImage(true);
            const uploadedUrls = await teamApi.uploadFiles([imageFile]);
            const profileImageUrl = uploadedUrls[0];
            if (!profileImageUrl) {
              setImageInputError("Image upload failed. Please try again.");
              return;
            }
            nextValues = { ...values, profileImageUrl };
          } catch (error) {
            setImageInputError(
              error instanceof Error ? error.message : "Image upload failed. Please try again."
            );
            return;
          } finally {
            setIsUploadingImage(false);
          }
        }
        await onSubmit(nextValues);
      })}
      className="space-y-4 text-slate-900"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-900">First Name</label>
          <input {...form.register("firstName")} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <p className="mt-1 text-xs text-rose-600">{form.formState.errors.firstName?.message}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-900">Last Name</label>
          <input {...form.register("lastName")} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <p className="mt-1 text-xs text-rose-600">{form.formState.errors.lastName?.message}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-900">Role</label>
          <select {...form.register("role")} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="ADMIN">ADMIN</option>
            <option value="MANAGER">MANAGER</option>
            <option value="CASHIER">CASHIER</option>
            <option value="EMPLOYEE">EMPLOYEE</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-900">Employment Type</label>
          <select
            {...form.register("employmentType")}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="FULL_TIME">Full Time</option>
            <option value="PART_TIME">Part Time</option>
            <option value="TRAINEE">Trainee</option>
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-900">Department</label>
          <input {...form.register("department")} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="text-sm font-medium text-slate-900">Salary</label>
          <input type="number" {...form.register("salary")} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <p className="mt-1 text-xs text-rose-600">{form.formState.errors.salary?.message}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-900">Currency</label>
          <input {...form.register("currency")} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-900">Rating</label>
          <select
            {...form.register("rating")}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="0">No rating</option>
            {ratingOptions.map((rating) => (
              <option key={rating} value={String(Number(rating))}>
                {rating}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-rose-600">{form.formState.errors.rating?.message as string | undefined}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-900">Email</label>
          <input type="email" {...form.register("email")} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <p className="mt-1 text-xs text-rose-600">{form.formState.errors.email?.message}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-900">Phone</label>
          <input {...form.register("phone")} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-900">Shift Start</label>
          <input
            type="time"
            {...form.register("shiftStart")}
            onClick={(event) => event.currentTarget.showPicker?.()}
            className="mt-1 w-full cursor-pointer rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-900">Shift End</label>
          <input
            type="time"
            {...form.register("shiftEnd")}
            onClick={(event) => event.currentTarget.showPicker?.()}
            className="mt-1 w-full cursor-pointer rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-900">Working Days</label>
        <div className="mt-1 flex flex-wrap gap-2">
          {dayOptions.map((day) => {
            const selected = selectedDays.includes(day);
            return (
              <button
                key={day}
                type="button"
                onClick={() => {
                  const current = form.getValues("workingDays");
                  if (selected) {
                    form.setValue(
                      "workingDays",
                      current.filter((item) => item !== day)
                    );
                  } else {
                    form.setValue("workingDays", [...current, day]);
                  }
                }}
                className={`rounded-md border px-2 py-1 text-xs ${selected ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700"}`}
                aria-pressed={selected}
              >
                {day}
              </button>
            );
          })}
        </div>
        <p className="mt-1 text-xs text-rose-600">{form.formState.errors.workingDays?.message}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-900">Hire Date</label>
          <input
            type="date"
            {...form.register("hireDate")}
            onClick={(event) => event.currentTarget.showPicker?.()}
            className="mt-1 w-full cursor-pointer rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-900">Profile Image Source</label>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setImageSource("link")}
              className={`rounded-md border px-3 py-2 text-sm ${imageSource === "link" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700"}`}
            >
              Link
            </button>
            <button
              type="button"
              onClick={() => setImageSource("file")}
              className={`rounded-md border px-3 py-2 text-sm ${imageSource === "file" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700"}`}
            >
              Device File
            </button>
          </div>
          {imageSource === "link" ? (
            <>
              <input
                {...form.register("profileImageUrl")}
                className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-rose-600">{form.formState.errors.profileImageUrl?.message}</p>
            </>
          ) : (
            <>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
                className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm file:mr-2 file:rounded file:border-0 file:bg-slate-100 file:px-2 file:py-1"
              />
              <p className="mt-1 text-xs text-rose-600">{imageInputError}</p>
            </>
          )}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-900">Title</label>
        <input {...form.register("title")} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-900">Address</label>
        <input {...form.register("address")} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-900">Notes</label>
        <textarea {...form.register("notes")} className="mt-1 min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </div>

      <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
        <Button type="submit" disabled={pending || isUploadingImage}>
          {isUploadingImage
            ? "Uploading image..."
            : pending
              ? "Saving..."
              : mode === "create"
                ? "Create Employee"
                : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
