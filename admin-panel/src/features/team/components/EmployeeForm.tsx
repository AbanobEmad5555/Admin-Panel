"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "@/components/ui/Button";
import { useStaffRolesList } from "@/features/admin-auth/hooks/useStaffRoles";
import { teamApi } from "@/features/team/api/team.api";
import {
  employeeFormSchema,
  type EmployeeFormValues,
} from "@/features/team/schemas/employee.schema";
import type { Employee, EmploymentType, TeamRole, WorkingDay } from "@/features/team/types";
import BilingualTextField from "@/modules/shared/components/BilingualTextField";
import LocalizedFormSection from "@/modules/shared/components/LocalizedFormSection";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

type EmployeeFormProps = {
  mode: "create" | "edit";
  initial?: Employee | null;
  pending?: boolean;
  onCancel: () => void;
  onSubmit: (values: EmployeeFormValues) => void | Promise<void>;
};

const dayOptions: WorkingDay[] = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const ratingOptions = Array.from({ length: 10 }, (_, index) => ((index + 1) * 0.5).toFixed(1));

const toDefaults = (mode: "create" | "edit", employee?: Employee | null): EmployeeFormValues => ({
  fullNameEn: employee?.fullNameEn ?? employee?.fullName ?? "",
  fullNameAr: employee?.fullNameAr ?? "",
  role: (employee?.role as TeamRole) ?? "EMPLOYEE",
  salary: employee?.salary ?? 0,
  currency: employee?.currency ?? "EGP",
  email: employee?.email ?? "",
  phone: employee?.phone ?? "",
  address: employee?.address ?? "",
  titleEn: employee?.titleEn ?? employee?.title ?? "",
  titleAr: employee?.titleAr ?? "",
  employmentType: (employee?.employmentType as EmploymentType | undefined) ?? "FULL_TIME",
  departmentEn: employee?.departmentEn ?? employee?.department ?? "",
  departmentAr: employee?.departmentAr ?? "",
  profileImageUrl: employee?.profileImageUrl ?? "",
  hireDate: employee?.hireDate ?? "",
  shiftStart: employee?.shiftStart ?? "",
  shiftEnd: employee?.shiftEnd ?? "",
  workingDays: employee?.workingDays?.length ? employee.workingDays : ["SUN", "MON", "TUE", "WED", "THU"],
  rating: employee?.rating ?? undefined,
  notes: employee?.notes ?? "",
  account: employee?.authAccount
    ? {
        createLogin: true,
        email: employee.authAccount.email ?? employee.email ?? "",
        phone: employee.authAccount.phone ?? employee.phone ?? "",
        roleId: employee.authAccount.role?.id ? String(employee.authAccount.role.id) : "",
        staffAccountStatus: employee.authAccount.staffAccountStatus ?? "ACTIVE",
      }
    : {
        createLogin: mode === "create",
        email: employee?.email ?? "",
        phone: employee?.phone ?? "",
        roleId: "",
        staffAccountStatus: "ACTIVE",
      },
});

export default function EmployeeForm({
  mode,
  initial,
  pending = false,
  onCancel,
  onSubmit,
}: EmployeeFormProps) {
  const { language, t } = useLocalization();
  const defaults = useMemo(() => toDefaults(mode, initial), [initial, mode]);
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema) as never,
    defaultValues: defaults,
  });
  const [imageSource, setImageSource] = useState<"link" | "file">("link");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageInputError, setImageInputError] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const selectedDays = form.watch("workingDays");
  const accountEnabled = Boolean(form.watch("account.createLogin"));
  const accountStatus = form.watch("account.staffAccountStatus");
  const rolesQuery = useStaffRolesList();
  const roleOptions = [
    { value: "ADMIN", en: "Admin", ar: "مسؤول" },
    { value: "MANAGER", en: "Manager", ar: "مدير" },
    { value: "CASHIER", en: "Cashier", ar: "أمين صندوق" },
    { value: "EMPLOYEE", en: "Employee", ar: "موظف" },
  ] as const;
  const employmentTypeOptions = [
    { value: "FULL_TIME", en: "Full Time", ar: "دوام كامل" },
    { value: "PART_TIME", en: "Part Time", ar: "دوام جزئي" },
    { value: "TRAINEE", en: "Trainee", ar: "متدرب" },
  ] as const;
  const dayLabels: Record<WorkingDay, { en: string; ar: string }> = {
    SUN: { en: "Sun", ar: "الأحد" },
    MON: { en: "Mon", ar: "الاثنين" },
    TUE: { en: "Tue", ar: "الثلاثاء" },
    WED: { en: "Wed", ar: "الأربعاء" },
    THU: { en: "Thu", ar: "الخميس" },
    FRI: { en: "Fri", ar: "الجمعة" },
    SAT: { en: "Sat", ar: "السبت" },
  };

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
        const currentAccount = nextValues.account;
        const initialAccount = initial?.authAccount ?? null;

        await onSubmit({
          ...nextValues,
          account:
            currentAccount?.createLogin || initialAccount
              ? {
                  createLogin: Boolean(currentAccount?.createLogin),
                  email: currentAccount?.email?.trim() || undefined,
                  phone: currentAccount?.phone?.trim() || undefined,
                  roleId: currentAccount?.roleId?.trim() || undefined,
                  staffAccountStatus: currentAccount?.staffAccountStatus,
                  activateLogin:
                    Boolean(initialAccount) &&
                    initialAccount?.staffAccountStatus !== "ACTIVE" &&
                    currentAccount?.staffAccountStatus === "ACTIVE",
                  deactivateLogin:
                    Boolean(initialAccount) &&
                    initialAccount?.staffAccountStatus === "ACTIVE" &&
                    currentAccount?.staffAccountStatus !== "ACTIVE",
                }
              : undefined,
        });
      })}
      className="space-y-4 text-slate-900"
    >
      <LocalizedFormSection title={t("field.fullName")}>
        <BilingualTextField
          register={form.register}
          nameEnField="fullNameEn"
          nameArField="fullNameAr"
          label={t("field.fullName")}
          showGroupLabel={false}
          requiredEn
          errors={form.formState.errors}
        />
      </LocalizedFormSection>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-900">
            {language === "ar" ? "الدور" : "Role"}
          </label>
          <select {...form.register("role")} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {language === "ar" ? option.ar : option.en}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-900">
            {language === "ar" ? "نوع التوظيف" : "Employment Type"}
          </label>
          <select
            {...form.register("employmentType")}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {employmentTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {language === "ar" ? option.ar : option.en}
              </option>
            ))}
          </select>
        </div>
      </div>

      <LocalizedFormSection title={t("field.department")}>
        <BilingualTextField
          register={form.register}
          nameEnField="departmentEn"
          nameArField="departmentAr"
          label={t("field.department")}
          showGroupLabel={false}
          errors={form.formState.errors}
        />
      </LocalizedFormSection>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="text-sm font-medium text-slate-900">
            {language === "ar" ? "الراتب" : "Salary"}
          </label>
          <input type="number" {...form.register("salary")} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <p className="mt-1 text-xs text-rose-600">{form.formState.errors.salary?.message}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-900">
            {language === "ar" ? "العملة" : "Currency"}
          </label>
          <input {...form.register("currency")} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-900">
            {language === "ar" ? "التقييم" : "Rating"}
          </label>
          <select
            {...form.register("rating")}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="0">{language === "ar" ? "بدون تقييم" : "No rating"}</option>
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
          <label className="text-sm font-medium text-slate-900">{t("field.email")}</label>
          <input type="email" {...form.register("email")} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <p className="mt-1 text-xs text-rose-600">{form.formState.errors.email?.message}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-900">{t("field.phone")}</label>
          <input {...form.register("phone")} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-900">
            {language === "ar" ? "بداية الوردية" : "Shift Start"}
          </label>
          <input
            type="time"
            {...form.register("shiftStart")}
            onClick={(event) => event.currentTarget.showPicker?.()}
            className="mt-1 w-full cursor-pointer rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-900">
            {language === "ar" ? "نهاية الوردية" : "Shift End"}
          </label>
          <input
            type="time"
            {...form.register("shiftEnd")}
            onClick={(event) => event.currentTarget.showPicker?.()}
            className="mt-1 w-full cursor-pointer rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-900">
          {language === "ar" ? "أيام العمل" : "Working Days"}
        </label>
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
                {language === "ar" ? dayLabels[day].ar : dayLabels[day].en}
              </button>
            );
          })}
        </div>
        <p className="mt-1 text-xs text-rose-600">{form.formState.errors.workingDays?.message}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-900">
            {language === "ar" ? "تاريخ التعيين" : "Hire Date"}
          </label>
          <input
            type="date"
            {...form.register("hireDate")}
            onClick={(event) => event.currentTarget.showPicker?.()}
            className="mt-1 w-full cursor-pointer rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-900">
            {language === "ar" ? "مصدر صورة الملف الشخصي" : "Profile Image Source"}
          </label>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setImageSource("link")}
              className={`rounded-md border px-3 py-2 text-sm ${imageSource === "link" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700"}`}
            >
              {language === "ar" ? "رابط" : "Link"}
            </button>
            <button
              type="button"
              onClick={() => setImageSource("file")}
              className={`rounded-md border px-3 py-2 text-sm ${imageSource === "file" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700"}`}
            >
              {language === "ar" ? "ملف من الجهاز" : "Device File"}
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

      <LocalizedFormSection title={t("field.title")}>
        <BilingualTextField
          register={form.register}
          nameEnField="titleEn"
          nameArField="titleAr"
          label={t("field.title")}
          showGroupLabel={false}
          errors={form.formState.errors}
        />
      </LocalizedFormSection>

      <div>
        <label className="text-sm font-medium text-slate-900">
          {language === "ar" ? "العنوان" : "Address"}
        </label>
        <input {...form.register("address")} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-900">
          {language === "ar" ? "ملاحظات" : "Notes"}
        </label>
        <textarea {...form.register("notes")} className="mt-1 min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      </div>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            {language === "ar" ? "حساب الطاقم" : "Staff Account"}
          </h3>
          <p className="text-xs text-slate-500">
            {language === "ar"
              ? "احتفظ بحالة الموظف وحالة حساب الدخول كحقلين منفصلين." : "Keep employee status and auth account status as separate fields."}
          </p>
        </div>

        <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
          <input type="checkbox" {...form.register("account.createLogin")} />
          <span>
            {language === "ar"
              ? "إنشاء أو تفعيل حساب دخول لهذا الموظف" : "Create or enable a login account for this employee"}
          </span>
        </label>

        {initial?.authAccount ? (
          <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700 md:grid-cols-2">
            <div>
              <span className="font-medium text-slate-900">
                {language === "ar" ? "حالة الحساب الحالية:" : "Current account status:"}
              </span>{" "}
              {initial.authAccount.staffAccountStatus ?? "-"}
            </div>
            <div>
              <span className="font-medium text-slate-900">
                {language === "ar" ? "الدور الحالي:" : "Current role:"}
              </span>{" "}
              {initial.authAccount.role?.name ?? "-"}
            </div>
          </div>
        ) : null}

        {accountEnabled ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-900">
                  {language === "ar" ? "بريد تسجيل الدخول" : "Login email"}
                </label>
                <input
                  type="email"
                  {...form.register("account.email")}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                <p className="mt-1 text-xs text-rose-600">
                  {form.formState.errors.account?.email?.message}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-900">
                  {language === "ar" ? "هاتف تسجيل الدخول" : "Login phone"}
                </label>
                <input
                  {...form.register("account.phone")}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-900">
                  {language === "ar" ? "دور الطاقم" : "Staff role"}
                </label>
                <select
                  {...form.register("account.roleId")}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">{language === "ar" ? "اختر دورًا" : "Select a role"}</option>
                  {(rolesQuery.data?.items ?? []).map((role) => (
                    <option key={String(role.id)} value={String(role.id)}>
                      {role.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-rose-600">
                  {form.formState.errors.account?.roleId?.message}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-900">
                  {language === "ar" ? "حالة حساب الدخول" : "Staff account status"}
                </label>
                <select
                  {...form.register("account.staffAccountStatus")}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="ACTIVE">{language === "ar" ? "نشط" : "ACTIVE"}</option>
                  <option value="INACTIVE">{language === "ar" ? "غير نشط" : "INACTIVE"}</option>
                  <option value="SUSPENDED">{language === "ar" ? "موقوف" : "SUSPENDED"}</option>
                </select>
              </div>
            </div>

            {initial?.authAccount && accountStatus && accountStatus !== initial.authAccount.staffAccountStatus ? (
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                {language === "ar"
                  ? "سيتم تحديث حالة حساب الدخول دون تغيير حالة الموظف." : "The login status will update without changing the employee status."}
              </div>
            ) : null}
          </>
        ) : null}
      </section>

      <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={pending}>
            {language === "ar" ? "إلغاء" : "Cancel"}
          </Button>
        <Button type="submit" disabled={pending || isUploadingImage}>
          {isUploadingImage
            ? language === "ar" ? "جارٍ رفع الصورة..." : "Uploading image..."
            : pending
              ? language === "ar" ? "جارٍ الحفظ..." : "Saving..."
              : mode === "create"
                ? language === "ar" ? "إنشاء موظف" : "Create Employee"
                : language === "ar"
                  ? "حفظ التغييرات"
                  : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}




































