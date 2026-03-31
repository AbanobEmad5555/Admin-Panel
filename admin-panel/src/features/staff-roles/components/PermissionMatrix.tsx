"use client";

import type { StaffPermission } from "@/features/admin-auth/types";
import { groupPermissionsByModule } from "@/features/staff-roles/permissionCatalog";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

type PermissionMatrixProps = {
  permissions: StaffPermission[];
  value: string[];
  disabled?: boolean;
  onChange: (next: string[]) => void;
};

const BASE_ACTION_ORDER = ["view", "create", "edit", "delete"];

export default function PermissionMatrix({
  permissions,
  value,
  disabled = false,
  onChange,
}: PermissionMatrixProps) {
  const { language } = useLocalization();
  const grouped = groupPermissionsByModule(permissions);
  const selected = new Set(value);

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([moduleKey, items]) => {
        const sortedItems = [...items].sort((left, right) => {
          const leftIndex = BASE_ACTION_ORDER.indexOf(left.actionKey);
          const rightIndex = BASE_ACTION_ORDER.indexOf(right.actionKey);
          if (leftIndex !== -1 || rightIndex !== -1) {
            return (leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex) -
              (rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex);
          }
          return left.actionKey.localeCompare(right.actionKey);
        });

        return (
          <section key={moduleKey} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                  {moduleKey.replace(/[_-]/g, " ")}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === "ar"
                    ? "حدد إجراءات العرض والإنشاء والتعديل والحذف أو الصلاحيات الخاصة."
                    : "Select base actions and any special permissions for this module."}
                </p>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {sortedItems.map((permission) => {
                const checked = selected.has(permission.key);
                return (
                  <label
                    key={permission.key}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm ${
                      checked
                        ? "border-slate-900 bg-white text-slate-900"
                        : "border-slate-200 bg-white text-slate-600"
                    } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={(event) => {
                        const next = new Set(selected);
                        if (event.target.checked) {
                          next.add(permission.key);
                        } else {
                          next.delete(permission.key);
                        }
                        onChange(Array.from(next));
                      }}
                    />
                    <span>{permission.label}</span>
                  </label>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
