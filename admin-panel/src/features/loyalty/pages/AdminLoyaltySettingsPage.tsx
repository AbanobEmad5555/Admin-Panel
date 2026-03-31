"use client";

import type { AxiosError } from "axios";
import { toast } from "sonner";
import AdminLayout from "@/components/layout/AdminLayout";
import { LoyaltySettingsForm } from "@/features/loyalty/components/LoyaltySettingsForm";
import { StatePanel } from "@/features/loyalty/components/StatePanel";
import { useUpdateLoyaltySettings } from "@/features/loyalty/hooks/useLoyaltyMutations";
import { useLoyaltySettings } from "@/features/loyalty/hooks/useLoyaltyQueries";
import { useLoyaltyPermissions } from "@/features/loyalty/utils/permissions";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

const getStatus = (error: unknown) => (error as AxiosError)?.response?.status;
const getMessage = (error: unknown, fallback: string) =>
  ((error as AxiosError<{ message?: string }>)?.response?.data?.message ?? fallback);

export default function AdminLoyaltySettingsPage() {
  const { t } = useLocalization();
  const permissions = useLoyaltyPermissions();
  const settingsQuery = useLoyaltySettings();
  const updateMutation = useUpdateLoyaltySettings();
  const statusCode = getStatus(settingsQuery.error);

  return (
    <AdminLayout title={t("loyalty.page.settings.title", "Loyalty Settings")}>
      <section className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">
            {t("loyalty.breadcrumb.root", "Loyalty")} / {t("loyalty.breadcrumb.settings", "Settings")}
          </div>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            {t("loyalty.page.settings.title", "Loyalty Settings")}
          </h1>
          <p className="text-sm text-slate-500">
            {t("loyalty.page.settings.subtitle", "Manage earn/redeem policy, precision, stacking, and expiration rules.")}
          </p>
        </div>

        {settingsQuery.isLoading ? (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="h-12 animate-pulse rounded bg-slate-200" />
            <div className="h-12 animate-pulse rounded bg-slate-200" />
            <div className="h-12 animate-pulse rounded bg-slate-200" />
          </div>
        ) : null}

        {settingsQuery.isError && statusCode === 403 ? (
          <StatePanel
            title={t("loyalty.state.permission.title", "Permission denied")}
            description={t("loyalty.state.permission.description", "You do not have permission to view loyalty settings.")}
            tone="warning"
          />
        ) : null}

        {settingsQuery.isError && statusCode !== 403 ? (
          <StatePanel
            title={t("loyalty.state.settingsError.title", "Failed to load settings")}
            description={getMessage(settingsQuery.error, t("common.error", "Something went wrong."))}
            tone="danger"
          />
        ) : null}

        {!settingsQuery.isLoading && !settingsQuery.isError ? (
          <LoyaltySettingsForm
            initialValues={{ ...settingsQuery.data!, reason: "" }}
            readOnly={!permissions.canManage}
            pending={updateMutation.isPending}
            disabledReason={
              permissions.isReadOnly
                ? t("loyalty.state.readOnly.description", "You have view access only. Settings fields are displayed in read-only mode.")
                : undefined
            }
            onSubmit={(values) => {
              updateMutation.mutate(values, {
                onSuccess: () => {
                  toast.success(t("loyalty.toast.settingsUpdated", "Loyalty settings updated."));
                },
                onError: (error) => {
                  toast.error(getMessage(error, t("common.error", "Something went wrong.")));
                },
              });
            }}
          />
        ) : null}
      </section>
    </AdminLayout>
  );
}
