"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/layout/AdminLayout";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import {
  useCreateStaffRole,
  useDeleteStaffRole,
  useStaffPermissionCatalog,
  useStaffRolesList,
} from "@/features/admin-auth/hooks/useStaffRoles";
import RoleEditorForm from "@/features/staff-roles/components/RoleEditorForm";
import { resolvePermissionCatalog } from "@/features/staff-roles/permissionCatalog";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

const getErrorMessage = (error: unknown, fallback: string) =>
  (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback;

export default function StaffRolesPage() {
  const { language } = useLocalization();
  const rolesQuery = useStaffRolesList();
  const permissionCatalogQuery = useStaffPermissionCatalog();
  const createMutation = useCreateStaffRole();
  const deleteMutation = useDeleteStaffRole();
  const [createOpen, setCreateOpen] = useState(false);

  const roles = useMemo(() => rolesQuery.data?.items ?? [], [rolesQuery.data?.items]);
  const permissionCatalog = useMemo(
    () => resolvePermissionCatalog(permissionCatalogQuery.data?.items),
    [permissionCatalogQuery.data?.items]
  );
  const text = useMemo(
    () =>
      language === "ar"
        ? {
            title: "أدوار الموظفين والصلاحيات",
            subtitle: "إدارة أدوار الطاقم وصلاحياتها وتوافقها مع النظام القديم.",
            createRole: "إنشاء دور مخصص",
            roleName: "الاسم",
            roleCode: "الكود",
            roleType: "النوع",
            assignments: "عدد التعيينات",
            actions: "الإجراءات",
            system: "نظام",
            custom: "مخصص",
            noRoles: "لم يتم العثور على أدوار.",
            loadFailed: "تعذر تحميل الأدوار.",
            created: "تم إنشاء الدور.",
            deleted: "تم حذف الدور.",
            deleteBlocked: "لا يمكن حذف هذا الدور من الواجهة.",
            open: "فتح",
          }
        : {
            title: "Staff Roles & Permissions",
            subtitle: "Manage staff roles, permissions, and legacy compatibility mappings.",
            createRole: "Create custom role",
            roleName: "Name",
            roleCode: "Code",
            roleType: "Type",
            assignments: "Assignments",
            actions: "Actions",
            system: "System",
            custom: "Custom",
            noRoles: "No roles found.",
            loadFailed: "Failed to load roles.",
            created: "Role created.",
            deleted: "Role deleted.",
            deleteBlocked: "This role cannot be deleted from the UI.",
            open: "Open",
          },
    [language]
  );

  return (
    <AdminLayout title={text.title} requiredPermissions={["team.manage_roles"]}>
      <section className="space-y-4">
        <header className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">{text.title}</h1>
              <p className="text-sm text-slate-500">{text.subtitle}</p>
            </div>
            <Button type="button" className="gap-2" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              {text.createRole}
            </Button>
          </div>
        </header>

        {rolesQuery.isError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 shadow-sm">
            {getErrorMessage(rolesQuery.error, text.loadFailed)}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">{text.roleName}</th>
                  <th className="px-4 py-3 font-semibold">{text.roleCode}</th>
                  <th className="px-4 py-3 font-semibold">{text.roleType}</th>
                  <th className="px-4 py-3 font-semibold">{text.assignments}</th>
                  <th className="px-4 py-3 font-semibold">{text.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {roles.map((role) => {
                  const deletable = !role.isSystem && role.assignmentCount === 0;
                  return (
                    <tr key={String(role.id)} className="text-slate-900">
                      <td className="px-4 py-3">
                        <div className="font-medium">{role.name}</div>
                        <div className="text-xs text-slate-500">{role.description || "-"}</div>
                      </td>
                      <td className="px-4 py-3">{role.code}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${role.isSystem ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}>
                          {role.isSystem ? text.system : text.custom}
                        </span>
                      </td>
                      <td className="px-4 py-3">{role.assignmentCount}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/team/roles/${role.id}`}
                            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
                          >
                            {text.open}
                          </Link>
                          <button
                            type="button"
                            disabled={!deletable || deleteMutation.isPending}
                            title={!deletable ? text.deleteBlocked : undefined}
                            onClick={() => {
                              if (!deletable) {
                                toast.error(text.deleteBlocked);
                                return;
                              }
                              deleteMutation.mutate(role.id, {
                                onSuccess: () => toast.success(text.deleted),
                                onError: (error) =>
                                  toast.error(getErrorMessage(error, text.deleteBlocked)),
                              });
                            }}
                            className="rounded-md border border-rose-200 p-2 text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!rolesQuery.isLoading && roles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      {text.noRoles}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <Modal
        title={text.createRole}
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        panelClassName="max-w-4xl"
      >
        <RoleEditorForm
          mode="create"
          pending={createMutation.isPending}
          permissionCatalog={permissionCatalog}
          onSubmit={(payload) => {
            createMutation.mutate(payload, {
              onSuccess: (role) => {
                toast.success(text.created);
                setCreateOpen(false);
                window.location.href = `/admin/team/roles/${role.id}`;
              },
              onError: (error) => toast.error(getErrorMessage(error, text.loadFailed)),
            });
          }}
        />
      </Modal>
    </AdminLayout>
  );
}
