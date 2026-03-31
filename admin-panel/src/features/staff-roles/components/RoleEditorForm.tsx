"use client";

import { useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import type { StaffPermission, StaffRoleDetails } from "@/features/admin-auth/types";
import PermissionMatrix from "@/features/staff-roles/components/PermissionMatrix";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

type RoleEditorFormProps = {
  mode: "create" | "edit";
  role?: StaffRoleDetails | null;
  permissionCatalog: StaffPermission[];
  pending?: boolean;
  onSubmit: (payload: {
    name: string;
    description?: string;
    legacyUserRole?: string;
    permissionKeys: string[];
  }) => void | Promise<void>;
};

const LEGACY_ROLE_OPTIONS = ["ADMIN", "MANAGER", "CASHIER", "EMPLOYEE", "OWNER"];

export default function RoleEditorForm({
  mode,
  role,
  permissionCatalog,
  pending = false,
  onSubmit,
}: RoleEditorFormProps) {
  const { language } = useLocalization();
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [legacyUserRole, setLegacyUserRole] = useState(role?.legacyUserRole ?? "EMPLOYEE");
  const [permissionKeys, setPermissionKeys] = useState<string[]>(
    role?.permissions?.map((permission) => permission.key) ?? []
  );

  const isSystem = Boolean(role?.isSystem);
  const text = useMemo(
    () =>
      language === "ar"
        ? {
            name: "اسم الدور",
            description: "الوصف",
            legacyRole: "الدور المتوافق مع النظام القديم",
            permissions: "الصلاحيات",
            systemImmutable: "هذا دور نظام. لا يمكن تغيير هوية الدور أو حذفه من الواجهة.",
            submitCreate: "إنشاء الدور",
            submitSave: "حفظ التغييرات",
          }
        : {
            name: "Role name",
            description: "Description",
            legacyRole: "Legacy user role",
            permissions: "Permissions",
            systemImmutable: "This is a system role. Its identity cannot be renamed or deleted in the UI.",
            submitCreate: "Create role",
            submitSave: "Save changes",
          },
    [language]
  );

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit({
          name: name.trim(),
          description: description.trim() || undefined,
          legacyUserRole: legacyUserRole.trim() || undefined,
          permissionKeys,
        });
      }}
    >
      {isSystem ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {text.systemImmutable}
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-900">{text.name}</label>
          <input
            value={name}
            disabled={isSystem}
            onChange={(event) => setName(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-900">{text.legacyRole}</label>
          <select
            value={legacyUserRole}
            disabled={isSystem}
            onChange={(event) => setLegacyUserRole(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {LEGACY_ROLE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-900">{text.description}</label>
        <textarea
          value={description}
          disabled={isSystem}
          onChange={(event) => setDescription(event.target.value)}
          className="mt-1 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <div className="mb-2 text-sm font-medium text-slate-900">{text.permissions}</div>
        <PermissionMatrix
          permissions={permissionCatalog}
          value={permissionKeys}
          onChange={setPermissionKeys}
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? (language === "ar" ? "جارٍ الحفظ..." : "Saving...") : mode === "create" ? text.submitCreate : text.submitSave}
        </Button>
      </div>
    </form>
  );
}
