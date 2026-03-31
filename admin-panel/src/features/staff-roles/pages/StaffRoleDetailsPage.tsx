"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  useStaffPermissionCatalog,
  useStaffRole,
  useUpdateStaffRoleMetadata,
  useUpdateStaffRolePermissions,
} from "@/features/admin-auth/hooks/useStaffRoles";
import RoleEditorForm from "@/features/staff-roles/components/RoleEditorForm";
import { resolvePermissionCatalog } from "@/features/staff-roles/permissionCatalog";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

const getErrorMessage = (error: unknown, fallback: string) =>
  (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback;

export default function StaffRoleDetailsPage() {
  const { language } = useLocalization();
  const params = useParams<{ roleId: string }>();
  const roleId = params.roleId;
  const permissionCatalogQuery = useStaffPermissionCatalog();
  const roleQuery = useStaffRole(roleId);
  const metadataMutation = useUpdateStaffRoleMetadata(roleId);
  const permissionsMutation = useUpdateStaffRolePermissions(roleId);

  const role = roleQuery.data ?? null;
  const permissionCatalog = useMemo(
    () => resolvePermissionCatalog(permissionCatalogQuery.data?.items),
    [permissionCatalogQuery.data?.items]
  );
  const text = useMemo(
    () =>
      language === "ar"
        ? {
            back: "العودة إلى الأدوار",
            titleFallback: "تفاصيل الدور",
            assignmentCount: "عدد التعيينات",
            legacyRole: "الدور القديم",
            loadFailed: "تعذر تحميل الدور.",
            updated: "تم تحديث الدور.",
          }
        : {
            back: "Back to roles",
            titleFallback: "Role details",
            assignmentCount: "Assignment count",
            legacyRole: "Legacy role",
            loadFailed: "Failed to load role.",
            updated: "Role updated.",
          },
    [language]
  );

  return (
    <AdminLayout title={role?.name ?? text.titleFallback} requiredPermissions={["team.manage_roles"]}>
      <section className="space-y-4">
        <div className="text-sm text-slate-500">
          <Link href="/admin/team/roles" className="hover:text-slate-700">
            {text.back}
          </Link>
        </div>

        {roleQuery.isError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 shadow-sm">
            {getErrorMessage(roleQuery.error, text.loadFailed)}
          </div>
        ) : null}

        {role ? (
          <>
            <header className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h1 className="text-2xl font-semibold text-slate-900">{role.name}</h1>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-600">
                <span>{role.code}</span>
                <span>{text.assignmentCount}: {role.assignmentCount}</span>
                <span>{text.legacyRole}: {role.legacyUserRole || "-"}</span>
              </div>
            </header>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <RoleEditorForm
                key={String(role.id)}
                mode="edit"
                role={role}
                pending={metadataMutation.isPending || permissionsMutation.isPending}
                permissionCatalog={permissionCatalog}
                onSubmit={(payload) => {
                  const tasks = [
                    permissionsMutation.mutateAsync({ permissionKeys: payload.permissionKeys }),
                  ];

                  if (!role.isSystem) {
                    tasks.unshift(
                      metadataMutation.mutateAsync({
                        name: payload.name,
                        description: payload.description,
                        legacyUserRole: payload.legacyUserRole,
                      })
                    );
                  }

                  Promise.all(tasks)
                    .then(() => toast.success(text.updated))
                    .catch((error) => toast.error(getErrorMessage(error, text.loadFailed)));
                }}
              />
            </div>
          </>
        ) : null}
      </section>
    </AdminLayout>
  );
}
