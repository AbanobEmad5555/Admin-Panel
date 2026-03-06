"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { AxiosError } from "axios";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/layout/AdminLayout";
import Button from "@/components/ui/Button";
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

export default function TeamPage() {
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
    <AdminLayout>
      <section className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Team</h1>
              <p className="text-sm text-slate-900">
                Manage employees, roles, documents and status.
              </p>
            </div>
            <Button type="button" className="gap-2" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Employee
            </Button>
          </div>
        </div>

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
          <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="h-9 animate-pulse rounded bg-slate-200" />
            <div className="h-9 animate-pulse rounded bg-slate-200" />
            <div className="h-9 animate-pulse rounded bg-slate-200" />
          </div>
        ) : null}

        {listQuery.isError && statusCode === 403 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-800 shadow-sm">
            You do not have permission to access team management.
          </div>
        ) : null}

        {listQuery.isError && statusCode === 404 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            Team module endpoint not found.
          </div>
        ) : null}

        {listQuery.isError && statusCode !== 403 && statusCode !== 404 ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 shadow-sm">
            {getErrorMessage(listQuery.error)}
          </div>
        ) : null}

        {!listQuery.isLoading && !listQuery.isError && filteredRows.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">No employees found</h2>
            <p className="mt-1 text-sm text-slate-900">Try changing filters or add a new employee.</p>
          </div>
        ) : null}

        {!listQuery.isLoading && !listQuery.isError && filteredRows.length > 0 ? (
          <>
            <EmployeesTable
              rows={filteredRows}
              onEdit={(row) => setEditingEmployeeId(row.id)}
              onChangeStatus={(row) => setStatusEmployee(row)}
            />
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <Button
                type="button"
                variant="secondary"
                disabled={page <= 1}
                onClick={() => applyParams({ page: Math.max(1, page - 1) })}
              >
                Previous
              </Button>
              <p className="text-sm text-slate-900">
                Page <span className="font-semibold">{page}</span> of{" "}
                <span className="font-semibold">{totalPages}</span>
              </p>
              <Button
                type="button"
                variant="secondary"
                disabled={page >= totalPages}
                onClick={() => applyParams({ page: Math.min(totalPages, page + 1) })}
              >
                Next
              </Button>
            </div>
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
              toast.success("Employee created successfully.");
              setCreateOpen(false);
            },
            onError: (error) => {
              const status = getStatus(error);
              if (status === 409) {
                toast.error("Conflict while creating employee.");
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
        pending={updateMutation.isPending || editingEmployeeQuery.isLoading}
        onClose={() => setEditingEmployeeId(null)}
        onSubmit={(values) => {
          if (!editingEmployeeId) return;
          updateMutation.mutate(values, {
            onSuccess: () => {
              setCachedEmploymentType(editingEmployeeId, values.employmentType);
              toast.success("Employee updated.");
              setEditingEmployeeId(null);
            },
            onError: (error) => toast.error(getErrorMessage(error)),
          });
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
              toast.success("Employee status updated.");
              setStatusEmployee(null);
            },
            onError: (error) => toast.error(getErrorMessage(error)),
          });
        }}
      />
    </AdminLayout>
  );
}
