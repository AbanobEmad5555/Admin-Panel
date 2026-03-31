"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import AdminLayout from "@/components/layout/AdminLayout";
import Button from "@/components/ui/Button";
import NotificationPreferenceToggle from "@/modules/notifications/components/NotificationPreferenceToggle";
import {
  buildPreferenceSnapshot,
  useNotificationPreferences,
  useResetNotificationPreferences,
  useUpdateNotificationPreferenceModules,
  useUpdateNotificationPreferenceTypes,
} from "@/modules/notifications/hooks/useNotificationPreferences";
import { useLocalization } from "@/modules/localization/LocalizationProvider";
import { StatePanel } from "@/features/loyalty/components/StatePanel";
import type {
  NotificationModule,
  NotificationPreferenceModuleItem,
  NotificationPreferenceSource,
  NotificationPreferenceTypeItem,
} from "@/modules/notifications/types/notifications.types";

type PreferenceDraftState = {
  modules: Record<string, NotificationPreferenceModuleItem>;
  types: Record<string, NotificationPreferenceTypeItem>;
};

const MODULE_ORDER: NotificationModule[] = [
  "dashboards",
  "inventory",
  "crm",
  "calendar",
  "pos",
  "invoices",
  "purchases",
  "website",
  "promo-codes",
  "team",
  "loyalty-program",
  "system",
];

const moduleOrderMap = new Map(MODULE_ORDER.map((module, index) => [module, index]));

const getErrorMessage = (error: unknown, fallback: string) => {
  if (!error || typeof error !== "object") {
    return fallback;
  }
  const maybeAxios = error as { response?: { data?: { message?: string }; status?: number } };
  return maybeAxios.response?.data?.message ?? fallback;
};

const getStatusCode = (error: unknown) =>
  (error as { response?: { status?: number } } | undefined)?.response?.status;

const toModuleRecord = (items: NotificationPreferenceModuleItem[]) =>
  Object.fromEntries(items.map((item) => [item.module, item]));

const toTypeRecord = (items: NotificationPreferenceTypeItem[]) =>
  Object.fromEntries(items.map((item) => [`${item.module}:${item.type}`, item]));

const sortModules = (modules: NotificationPreferenceModuleItem[]) =>
  [...modules].sort((left, right) => {
    const leftOrder = moduleOrderMap.get(left.module) ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = moduleOrderMap.get(right.module) ?? Number.MAX_SAFE_INTEGER;

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    return left.label.localeCompare(right.label);
  });

const buildComparableSnapshot = (draft: PreferenceDraftState) => ({
  modules: Object.values(draft.modules)
    .map(({ module, isEnabled }) => ({ module, isEnabled }))
    .sort((left, right) => left.module.localeCompare(right.module)),
  types: Object.values(draft.types)
    .map(({ module, type, isEnabled }) => ({ module, type, isEnabled }))
    .sort((left, right) =>
      `${left.module}:${left.type}`.localeCompare(`${right.module}:${right.type}`),
    ),
});

const getSourceLabel = (
  source: NotificationPreferenceSource | undefined,
  t: (key: string, fallback?: string) => string,
) => {
  if (source === "default") {
    return t("notifications.preferences.source.default", "Default");
  }

  if (source === "module") {
    return t("notifications.preferences.source.module", "Inherited from module");
  }

  if (source) {
    return source;
  }

  return t("notifications.preferences.source.saved", "Saved");
};

export default function AdminNotificationPreferencesPage() {
  const router = useRouter();
  const { t } = useLocalization();
  const preferencesQuery = useNotificationPreferences();
  const updateModules = useUpdateNotificationPreferenceModules();
  const updateTypes = useUpdateNotificationPreferenceTypes();
  const resetPreferences = useResetNotificationPreferences();
  const [moduleOverrides, setModuleOverrides] = useState<Record<string, boolean>>({});
  const [typeOverrides, setTypeOverrides] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const status = getStatusCode(preferencesQuery.error);
    if (status === 403) {
      router.replace("/403");
    }
  }, [preferencesQuery.error, router]);

  const draft = useMemo<PreferenceDraftState>(() => {
    const modules = preferencesQuery.data?.modules ?? [];
    const types = preferencesQuery.data?.types ?? [];

    return {
      modules: toModuleRecord(
        modules.map((item) => ({
          ...item,
          isEnabled: moduleOverrides[item.module] ?? item.isEnabled,
        })),
      ),
      types: toTypeRecord(
        types.map((item) => ({
          ...item,
          isEnabled: typeOverrides[`${item.module}:${item.type}`] ?? item.isEnabled,
        })),
      ),
    };
  }, [moduleOverrides, preferencesQuery.data, typeOverrides]);

  const orderedModules = useMemo(() => sortModules(Object.values(draft.modules)), [draft.modules]);

  const typesByModule = useMemo(() => {
    const grouped = new Map<NotificationModule, NotificationPreferenceTypeItem[]>();

    Object.values(draft.types).forEach((item) => {
      const existing = grouped.get(item.module) ?? [];
      existing.push(item);
      grouped.set(item.module, existing);
    });

    grouped.forEach((items, module) => {
      grouped.set(
        module,
        [...items].sort((left, right) => left.label.localeCompare(right.label)),
      );
    });

    return grouped;
  }, [draft.types]);

  const initialSnapshot = useMemo(
    () => JSON.stringify(buildPreferenceSnapshot(preferencesQuery.data)),
    [preferencesQuery.data],
  );
  const currentSnapshot = useMemo(
    () => JSON.stringify(buildComparableSnapshot(draft)),
    [draft],
  );
  const isDirty = initialSnapshot !== currentSnapshot;
  const isSaving = updateModules.isPending || updateTypes.isPending;
  const isBusy = isSaving || resetPreferences.isPending;

  const handleModuleChange = (module: NotificationModule, isEnabled: boolean) => {
    setModuleOverrides((current) => ({
      ...current,
      [module]: isEnabled,
    }));
  };

  const handleTypeChange = (module: NotificationModule, type: string, isEnabled: boolean) => {
    const key = `${module}:${type}`;

    setTypeOverrides((current) => ({
      ...current,
      [key]: isEnabled,
    }));
  };

  const handleResetLocal = () => {
    setModuleOverrides({});
    setTypeOverrides({});
  };

  const handleSave = async () => {
    if (!preferencesQuery.data) {
      return;
    }

    const originalModules = toModuleRecord(preferencesQuery.data.modules);
    const originalTypes = toTypeRecord(preferencesQuery.data.types);

    const changedModules = Object.values(draft.modules)
      .filter((item) => originalModules[item.module]?.isEnabled !== item.isEnabled)
      .map(({ module, isEnabled }) => ({ module, isEnabled }));

    const changedTypes = Object.values(draft.types)
      .filter((item) => originalTypes[`${item.module}:${item.type}`]?.isEnabled !== item.isEnabled)
      .map(({ module, type, isEnabled }) => ({ module, type, isEnabled }));

    if (changedModules.length === 0 && changedTypes.length === 0) {
      return;
    }

    try {
      if (changedModules.length > 0) {
        await updateModules.mutateAsync({ preferences: changedModules });
      }

      if (changedTypes.length > 0) {
        await updateTypes.mutateAsync({ preferences: changedTypes });
      }

      setModuleOverrides({});
      setTypeOverrides({});
      toast.success(t("notifications.preferences.saveSuccess", "Notification preferences saved."));
    } catch (error) {
      toast.error(
        getErrorMessage(error, t("notifications.preferences.saveError", "Failed to save notification preferences.")),
      );
    }
  };

  const handleResetDefaults = async () => {
    try {
      await resetPreferences.mutateAsync();
      setModuleOverrides({});
      setTypeOverrides({});
      toast.success(
        t("notifications.preferences.resetSuccess", "Notification preferences reset to default."),
      );
    } catch (error) {
      toast.error(
        getErrorMessage(error, t("notifications.preferences.resetError", "Failed to reset notification preferences.")),
      );
    }
  };

  if (preferencesQuery.isLoading) {
    return (
      <AdminLayout title={t("notifications.preferences.title", "Notification Preferences")}>
        <section className="space-y-4">
          <div className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm" />
          <div className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm" />
        </section>
      </AdminLayout>
    );
  }

  if (preferencesQuery.isError && getStatusCode(preferencesQuery.error) !== 403) {
    return (
      <AdminLayout title={t("notifications.preferences.title", "Notification Preferences")}>
        <StatePanel
          title={t("notifications.preferences.loadFailed", "Couldn't load notification preferences")}
          description={getErrorMessage(
            preferencesQuery.error,
            t("notifications.preferences.loadError", "Failed to load notification preferences."),
          )}
          tone="danger"
          action={
            <Button type="button" variant="secondary" onClick={() => void preferencesQuery.refetch()}>
              {t("notifications.preferences.retry", "Retry")}
            </Button>
          }
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={t("notifications.preferences.title", "Notification Preferences")}>
      <section className="space-y-4">
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="text-sm text-slate-500">
                {t("notifications.title", "Notifications")} /{" "}
                {t("notifications.preferences.breadcrumb", "Preferences")}
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">
                  {t("notifications.preferences.title", "Notification Preferences")}
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  {t(
                    "notifications.preferences.subtitle",
                    "Choose which notification modules and types remain enabled for your own admin account.",
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push("/admin/notifications")}
              >
                {t("notifications.preferences.backToNotifications", "Back to notifications")}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => void handleResetDefaults()}
                disabled={isBusy}
              >
                {resetPreferences.isPending
                  ? t("common.updating", "Updating...")
                  : t("notifications.preferences.resetToDefault", "Reset to default")}
              </Button>
              <Button type="button" onClick={() => void handleSave()} disabled={!isDirty || isBusy}>
                {isSaving
                  ? t("common.updating", "Updating...")
                  : t("common.saveChanges", "Save Changes")}
              </Button>
            </div>
          </div>
        </header>

        {isDirty ? (
          <StatePanel
            title={t("notifications.preferences.unsavedTitle", "Unsaved changes")}
            description={t(
              "notifications.preferences.unsavedDescription",
              "Your toggle changes are local until you save them.",
            )}
            tone="warning"
            action={
              <Button type="button" variant="secondary" onClick={handleResetLocal} disabled={isBusy}>
                {t("notifications.preferences.discardChanges", "Discard changes")}
              </Button>
            }
          />
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-600">
              {t(
                "notifications.preferences.savedStateNote",
                "Type badges show whether a setting is using the default behavior or inheriting from its module.",
              )}
            </p>
          </div>
        )}

        {orderedModules.length === 0 ? (
          <StatePanel
            title={t("notifications.preferences.emptyTitle", "No notification preferences returned")}
            description={t(
              "notifications.preferences.emptyDescription",
              "The backend did not return any modules for this admin account.",
            )}
          />
        ) : null}

        <div className="space-y-4">
          {orderedModules.map((moduleItem) => {
            const childTypes = typesByModule.get(moduleItem.module) ?? [];

            return (
              <section
                key={moduleItem.module}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="space-y-4">
                  <NotificationPreferenceToggle
                    id={`module-${moduleItem.module}`}
                    label={moduleItem.label}
                    description={t(
                      "notifications.preferences.moduleDescription",
                      "Disable the module to mute all notification types listed below.",
                    )}
                    checked={moduleItem.isEnabled}
                    disabled={isBusy}
                    badge={
                      moduleItem.isEnabled
                        ? t("common.active", "Active")
                        : t("common.inactive", "Inactive")
                    }
                    onChange={(checked) => handleModuleChange(moduleItem.module, checked)}
                  />

                  {childTypes.length > 0 ? (
                    <div className="space-y-3 border-t border-slate-200 pt-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h2 className="text-sm font-semibold text-slate-900">
                            {t("notifications.preferences.typesHeading", "Notification types")}
                          </h2>
                          <p className="text-sm text-slate-500">
                            {moduleItem.isEnabled
                              ? t(
                                  "notifications.preferences.typesEnabledHint",
                                  "These type-level settings apply only while the module stays enabled.",
                                )
                              : t(
                                  "notifications.preferences.typesDisabledHint",
                                  "Type-level settings are temporarily disabled because the module is turned off.",
                                )}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        {childTypes.map((typeItem) => (
                          <NotificationPreferenceToggle
                            key={`${typeItem.module}:${typeItem.type}`}
                            id={`type-${typeItem.module}-${typeItem.type}`}
                            label={typeItem.label}
                            description={typeItem.type}
                            checked={typeItem.isEnabled}
                            disabled={isBusy || !moduleItem.isEnabled}
                            badge={getSourceLabel(typeItem.source, t)}
                            onChange={(checked) =>
                              handleTypeChange(typeItem.module, typeItem.type, checked)
                            }
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </section>
            );
          })}
        </div>
      </section>
    </AdminLayout>
  );
}
