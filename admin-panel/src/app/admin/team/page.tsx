"use client";

import { Suspense, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { AxiosError } from "axios";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/layout/AdminLayout";
import Button from "@/components/ui/Button";
import GradientCard from "@/components/ui/GradientCard";
import PageHeader from "@/components/ui/PageHeader";
import { useAssignStaffUserRole } from "@/features/admin-auth/hooks/useStaffRoles";
import CreateEmployeeDrawer from "@/features/team/components/CreateEmployeeDrawer";
import EditEmployeeDrawer from "@/features/team/components/EditEmployeeDrawer";
import EmployeesFiltersBar, {
  type EmployeesFilterState,
} from "@/features/team/components/EmployeesFiltersBar";
import EmployeesTable from "@/features/team/components/EmployeesTable";
import StatusChangeModal from "@/features/team/components/StatusChangeModal";
import {
  useChangeEmployeeStatus,
  useCreateEmployee,
  useEmployee,
  useEmployeesDetails,
  useEmployeesList,
  useUpdateEmployee,
} from "@/features/team/hooks/useTeam";
import {
  getCachedEmploymentType,
  setCachedEmploymentType,
} from "@/features/team/utils/employmentTypeCache";
import { useAuth } from "@/hooks/useAuth";
import { useLocalization } from "@/modules/localization/LocalizationProvider";
import type { Employee, EmployeeListParams, EmploymentType } from "@/features/team/types";

const PAGE_SIZE = 20;

const defaultFilters: EmployeesFilterState = {
  search: "",
  role: "",
  status: "",
  employmentType: "",
  sort: "name_asc",
};

const getStatus = (error: unknown) => (error as AxiosError)?.response?.status;
const getErrorMessage = (error: unknown) =>
  ((error as AxiosError<{ message?: string }>)?.response?.data?.message ?? "Something went wrong.");

function TeamPageContent() {
  const { language } = useLocalization();
  const { hasPermission } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const employmentTypeFilter = useMemo<EmploymentType | "">(() => {
    const value = searchParams.get("employmentType");
    if (value === "FULL_TIME" || value === "PART_TIME" || value === "TRAINEE") {
      return value;
    }
    return "";
  }, [searchParams]);

  const params = useMemo<EmployeeListParams>(() => {
    const page = Number(searchParams.get("page") ?? "1");
    const limit = Number(searchParams.get("limit") ?? String(PAGE_SIZE));
    const search = searchParams.get("search") ?? "";
    const role = (searchParams.get("role") as EmployeeListParams["role"]) ?? "";
    const status = (searchParams.get("status") as EmployeeListParams["status"]) ?? "";
    const sort = (searchParams.get("sort") as EmployeeListParams["sort"]) ?? "name_asc";
    return {
      page: Number.isFinite(page) && page > 0 ? page : 1,
      limit: Number.isFinite(limit) && limit > 0 ? limit : PAGE_SIZE,
      search,
      role,
      status,
      sort,
    };
  }, [searchParams]);

  const draftFilters = useMemo<EmployeesFilterState>(
    () => ({
      search: params.search ?? "",
      role: params.role ?? "",
      status: params.status ?? "",
      employmentType: employmentTypeFilter,
      sort: params.sort ?? "name_asc",
    }),
    [employmentTypeFilter, params]
  );

  const [localFilters, setLocalFilters] = useState<EmployeesFilterState>(draftFilters);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [statusEmployee, setStatusEmployee] = useState<Employee | null>(null);

  const listQuery = useEmployeesList(params);
  const editingEmployeeQuery = useEmployee(editingEmployeeId ?? "");
  const editingEmployee = editingEmployeeQuery.data ?? null;
  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee(editingEmployeeId ?? "");
  const statusMutation = useChangeEmployeeStatus(statusEmployee?.id ?? "");
  const assignRoleMutation = useAssignStaffUserRole();

  const canCreate = hasPermission(["team.create", "team.edit"]);
  const canEdit = hasPermission(["team.edit", "team.manage_roles"]);

  const applyParams = (next: Partial<EmployeeListParams> & { employmentType?: EmploymentType | "" }) => {
    const result = new URLSearchParams(searchParams.toString());
    const merged: EmployeeListParams = { ...params, ...next };
    const mergedEmploymentType =
      next.employmentType !== undefined ? next.employmentType : employmentTypeFilter;
    result.set("page", String(merged.page));
    result.set("limit", String(merged.limit));
    if (merged.search) result.set("search", merged.search);
    else result.delete("search");
    if (merged.role) result.set("role", merged.role);
    else result.delete("role");
    if (merged.status) result.set("status", merged.status);
    else result.delete("status");
    if (merged.sort) result.set("sort", merged.sort);
    else result.delete("sort");
    if (mergedEmploymentType) result.set("employmentType", mergedEmploymentType);
    else result.delete("employmentType");
    router.replace(`${pathname}?${result.toString()}`);
  };

  const statusCode = getStatus(listQuery.error);
  const rows = useMemo(() => listQuery.data?.items ?? [], [listQuery.data?.items]);
  const detailQueries = useEmployeesDetails(rows.map((row) => row.id));
  const detailMap = useMemo(
    () =>
      new Map(
        detailQueries
          .filter((query) => query.data)
          .map((query) => [query.data!.id, query.data!])
      ),
    [detailQueries]
  );
  const tableRows = useMemo(
    () =>
      rows.map((row) => {
        const details = detailMap.get(row.id);
        if (!details) {
          return row;
        }
        return {
          ...row,
          employmentType:
            details.employmentType || row.employmentType || getCachedEmploymentType(row.id),
          department: details.department || row.department,
          shiftStart: details.shiftStart || row.shiftStart,
          shiftEnd: details.shiftEnd || row.shiftEnd,
          hireDate: details.hireDate || row.hireDate,
          authAccount: details.authAccount || row.authAccount,
        };
      }),
    [detailMap, rows]
  );
  const filteredRows = useMemo(
    () =>
      tableRows.filter((row) =>
        employmentTypeFilter
          ? (row.employmentType || getCachedEmploymentType(row.id)) === employmentTypeFilter
          : true
      ),
    [employmentTypeFilter, tableRows]
  );
  const page = params.page;
  const totalPages = listQuery.data?.totalPages ?? 1;

  return (
    <AdminLayout requiredPermissions={["team.view"]}>
      <section className="space-y-6">
        <PageHeader
          eyebrow={language === "ar" ? "إدارة الفريق" : "Team Management"}
          title={language === "ar" ? "الفريق" : "Team"}
          description={
            language === "ar"
              ? "إدارة الموظفين والأدوار والمستندات والحالة."
              : "Manage employees, roles, documents and status."
          }
          actions={
            canCreate ? (
              <Button type="button" className="gap-2" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                {language === "ar" ? "إضافة موظف" : "Add Employee"}
              </Button>
            ) : null
          }
        />

        <EmployeesFiltersBar
          value={localFilters}
          onChange={setLocalFilters}
          onApply={() => {
            applyParams({ ...localFilters, page: 1, limit: PAGE_SIZE });
          }}
          onClear={() => {
            setLocalFilters(defaultFilters);
            applyParams({ page: 1, limit: PAGE_SIZE, ...defaultFilters });
          }}
        />

        {listQuery.isLoading ? (
          <GradientCard padding="md" className="space-y-2">
            <div className="h-9 animate-pulse rounded-2xl bg-white/8" />
            <div className="h-9 animate-pulse rounded-2xl bg-white/8" />
            <div className="h-9 animate-pulse rounded-2xl bg-white/8" />
          </GradientCard>
        ) : null}

        {listQuery.isError && statusCode === 403 ? (
          <GradientCard padding="md" className="border-amber-300/20 bg-amber-500/12 text-amber-100">
            {language === "ar"
              ? "ليس لديك صلاحية للوصول إلى إدارة الفريق." : "You do not have permission to access team management."}
          </GradientCard>
        ) : null}

        {listQuery.isError && statusCode === 404 ? (
          <GradientCard padding="lg" className="text-center">
            {language === "ar" ? "لم يتم العثور على واجهة الفريق." : "Team module endpoint not found."}
          </GradientCard>
        ) : null}

        {listQuery.isError && statusCode !== 403 && statusCode !== 404 ? (
          <GradientCard padding="md" className="border-rose-300/20 bg-rose-500/12 text-sm text-rose-100">
            {getErrorMessage(listQuery.error)}
          </GradientCard>
        ) : null}

        {!listQuery.isLoading && !listQuery.isError && filteredRows.length === 0 ? (
          <GradientCard padding="lg" className="text-center">
            <h2 className="text-lg font-semibold text-slate-50">
              {language === "ar" ? "لا يوجد موظفون" : "No employees found"}
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              {language === "ar"
                ? "جرّب تغيير الفلاتر أو إضافة موظف جديد." : "Try changing filters or add a new employee."}
            </p>
          </GradientCard>
        ) : null}

        {!listQuery.isLoading && !listQuery.isError && filteredRows.length > 0 ? (
          <>
            <EmployeesTable
              rows={filteredRows}
              canEdit={canEdit}
              onEdit={(row) => setEditingEmployeeId(row.id)}
              onChangeStatus={(row) => setStatusEmployee(row)}
            />
            <GradientCard padding="sm" className="flex flex-wrap items-center justify-between gap-3">
              <Button
                type="button"
                variant="secondary"
                disabled={page <= 1}
                onClick={() => applyParams({ page: Math.max(1, page - 1) })}
              >
                {language === "ar" ? "السابق" : "Previous"}
              </Button>
              <p className="text-sm text-slate-900">{language === "ar" ? "الصفحة" : "Page"} <span className="font-semibold">{page}</span> {language === "ar" ? "من" : "of"}{" "}<span className="font-semibold">{totalPages}</span></p>
              <Button
                type="button"
                variant="secondary"
                disabled={page >= totalPages}
                onClick={() => applyParams({ page: Math.min(totalPages, page + 1) })}
              >
                {language === "ar" ? "التالي" : "Next"}
              </Button>
            </GradientCard>
          </>
        ) : null}
      </section>

      <CreateEmployeeDrawer
        open={createOpen}
        pending={createMutation.isPending}
        onClose={() => setCreateOpen(false)}
        onSubmit={(values) => {
          createMutation.mutate(values, {
            onSuccess: (employee) => {
              if (employee?.id) {
                setCachedEmploymentType(employee.id, values.employmentType);
              }
              toast.success(language === "ar" ? "تم إنشاء الموظف بنجاح." : "Employee created successfully.");
              setCreateOpen(false);
            },
            onError: (error) => {
              const status = getStatus(error);
              if (status === 409) {
                toast.error(language === "ar" ? "يوجد تعارض أثناء إنشاء الموظف." : "Conflict while creating employee.");
                return;
              }
              toast.error(getErrorMessage(error));
            },
          });
        }}
      />

      <EditEmployeeDrawer
        open={Boolean(editingEmployeeId)}
        employee={editingEmployee}
        pending={updateMutation.isPending || editingEmployeeQuery.isLoading || assignRoleMutation.isPending}
        onClose={() => setEditingEmployeeId(null)}
        onSubmit={(values) => {
          if (!editingEmployeeId) return;

          const previousRoleId = editingEmployee?.authAccount?.role?.id
            ? String(editingEmployee.authAccount.role.id)
            : null;
          const nextRoleId = values.account?.roleId ? String(values.account.roleId) : null;

          updateMutation.mutate(
            {
              ...values,
              account:
                previousRoleId && nextRoleId && previousRoleId !== nextRoleId
                  ? {
                      createLogin: Boolean(values.account?.createLogin),
                      email: values.account?.email,
                      phone: values.account?.phone,
                      roleId: undefined,
                      staffAccountStatus: values.account?.staffAccountStatus,
                      activateLogin: values.account?.activateLogin,
                      deactivateLogin: values.account?.deactivateLogin,
                    }
                  : values.account,
            },
            {
              onSuccess: async () => {
                try {
                  if (
                    editingEmployee?.authAccount?.userId &&
                    previousRoleId &&
                    nextRoleId &&
                    previousRoleId !== nextRoleId
                  ) {
                    await assignRoleMutation.mutateAsync({
                      userId: editingEmployee.authAccount.userId,
                      payload: { roleId: nextRoleId },
                    });
                  }
                  setCachedEmploymentType(editingEmployeeId, values.employmentType);
                  toast.success(language === "ar" ? "تم تحديث الموظف." : "Employee updated.");
                  setEditingEmployeeId(null);
                } catch (error) {
                  toast.error(getErrorMessage(error));
                }
              },
              onError: (error) => toast.error(getErrorMessage(error)),
            }
          );
        }}
      />

      <StatusChangeModal
        open={Boolean(statusEmployee)}
        currentStatus={statusEmployee?.status}
        pending={statusMutation.isPending}
        onClose={() => setStatusEmployee(null)}
        onSubmit={(values) => {
          if (!statusEmployee) return;
          statusMutation.mutate(values, {
            onSuccess: () => {
              toast.success(language === "ar" ? "تم تحديث حالة الموظف." : "Employee status updated.");
              setStatusEmployee(null);
            },
            onError: (error) => toast.error(getErrorMessage(error)),
          });
        }}
      />
    </AdminLayout>
  );
}

export default function TeamPage() {
  return (
    <Suspense fallback={null}>
      <TeamPageContent />
    </Suspense>
  );
}
















