"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {
  loyaltySettingsDefaults,
  loyaltySettingsSchema,
} from "@/features/loyalty/schemas/settings.schema";
import { normalizeDecimalInput } from "@/features/loyalty/utils/formatters";
import type { LoyaltySettingsFormValues } from "@/features/loyalty/types";
import {
  LOYALTY_EARN_BASE_OPTIONS,
  LOYALTY_ROUNDING_MODE_OPTIONS,
} from "@/features/loyalty/types";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

type LoyaltySettingsFormProps = {
  initialValues?: LoyaltySettingsFormValues;
  readOnly?: boolean;
  pending?: boolean;
  disabledReason?: string;
  onSubmit: (values: LoyaltySettingsFormValues) => void;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-rose-600">{message}</p>;
}

export function LoyaltySettingsForm({
  initialValues,
  readOnly = false,
  pending = false,
  disabledReason,
  onSubmit,
}: LoyaltySettingsFormProps) {
  const { t } = useLocalization();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isDirty, isValid },
  } = useForm<LoyaltySettingsFormValues>({
    resolver: zodResolver(loyaltySettingsSchema),
    mode: "onChange",
    defaultValues: initialValues ?? loyaltySettingsDefaults,
  });

  useEffect(() => {
    if (initialValues) {
      reset(initialValues);
    }
  }, [initialValues, reset]);

  const isEnabled = useWatch({ control, name: "isEnabled" });
  const submitDisabled = readOnly || pending || !isDirty || !isValid;

  const decimalField = (
    name: keyof LoyaltySettingsFormValues,
    label: string,
    helperText: string,
    placeholder: string
  ) => (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <Input
        {...register(name)}
        onChange={(event) =>
          setValue(name, normalizeDecimalInput(event.target.value) as never, {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
        inputMode="decimal"
        placeholder={placeholder}
        disabled={readOnly}
      />
      <p className="text-xs text-slate-500">{helperText}</p>
      <FieldError message={errors[name]?.message} />
    </div>
  );

  const integerField = (
    name: keyof LoyaltySettingsFormValues,
    label: string,
    helperText: string
  ) => (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <Input type="number" {...register(name, { valueAsNumber: true })} disabled={readOnly} />
      <p className="text-xs text-slate-500">{helperText}</p>
      <FieldError message={errors[name]?.message} />
    </div>
  );

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      {disabledReason ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {disabledReason}
        </div>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {t("loyalty.settings.section.program", "Program controls")}
          </h2>
          <p className="text-sm text-slate-500">
            {t(
              "loyalty.settings.section.programHint",
              "Enable or disable the module, earning base, and stacking behavior."
            )}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" {...register("isEnabled")} disabled={readOnly} />
            {t("loyalty.field.isEnabled", "Loyalty program enabled")}
          </label>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              {t("loyalty.field.earnBase", "Earn base")}
            </label>
            <select
              {...register("earnBase")}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              disabled={readOnly}
            >
              {LOYALTY_EARN_BASE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey, option.value)}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              {...register("allowPromoCodeStacking")}
              disabled={readOnly}
            />
            {t("loyalty.field.allowPromoCodeStacking", "Allow promo code stacking")}
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              {...register("allowManualDiscountStacking")}
              disabled={readOnly}
            />
            {t(
              "loyalty.field.allowManualDiscountStacking",
              "Allow manual discount stacking"
            )}
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {t("loyalty.settings.section.earn", "Earn ratio")}
          </h2>
          <p className="text-sm text-slate-500">
            {t(
              "loyalty.settings.section.earnHint",
              "Keep money and points as exact decimal strings."
            )}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {decimalField(
            "earnAmount",
            t("loyalty.field.earnAmount", "Earn amount"),
            t(
              "loyalty.helper.earnAmount",
              "Monetary amount required to earn the ratio below."
            ),
            "1.00"
          )}
          {decimalField(
            "earnPoints",
            t("loyalty.field.earnPoints", "Earn points"),
            t("loyalty.helper.earnPoints", "Points granted for each earn amount."),
            "1.000"
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {t("loyalty.settings.section.redeem", "Redeem ratio")}
          </h2>
          <p className="text-sm text-slate-500">
            {t(
              "loyalty.settings.section.redeemHint",
              "Configure redeem ratio and order-level limits separately."
            )}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {decimalField(
            "redeemPoints",
            t("loyalty.field.redeemPoints", "Redeem points"),
            t(
              "loyalty.helper.redeemPoints",
              "Points needed to unlock the redeem amount."
            ),
            "10.000"
          )}
          {decimalField(
            "redeemAmount",
            t("loyalty.field.redeemAmount", "Redeem amount"),
            t(
              "loyalty.helper.redeemAmount",
              "Monetary value granted for redeem points."
            ),
            "1.00"
          )}
          {decimalField(
            "minRedeemPoints",
            t("loyalty.field.minRedeemPoints", "Minimum redeem points"),
            t(
              "loyalty.helper.minRedeemPoints",
              "Minimum balance required before redemption is allowed."
            ),
            "50.000"
          )}
          {decimalField(
            "maxRedeemPointsPerOrder",
            t("loyalty.field.maxRedeemPointsPerOrder", "Maximum redeem points per order"),
            t(
              "loyalty.helper.maxRedeemPointsPerOrder",
              "Upper cap applied at checkout per order."
            ),
            "1000.000"
          )}
          {decimalField(
            "minPayableAmountAfterRedeem",
            t(
              "loyalty.field.minPayableAmountAfterRedeem",
              "Minimum payable amount after redeem"
            ),
            t(
              "loyalty.helper.minPayableAmountAfterRedeem",
              "Amount that must remain payable after loyalty deduction."
            ),
            "10.00"
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {t("loyalty.settings.section.precision", "Precision and expiry")}
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {integerField(
            "expirationDays",
            t("loyalty.field.expirationDays", "Expiration days"),
            t(
              "loyalty.helper.expirationDays",
              "Number of days before earned points expire."
            )
          )}
          {integerField(
            "expiringSoonThresholdDays",
            t("loyalty.field.expiringSoonThresholdDays", "Expiring soon threshold"),
            t(
              "loyalty.helper.expiringSoonThresholdDays",
              "Threshold used to highlight soon-to-expire balances."
            )
          )}
          {integerField(
            "pointsPrecision",
            t("loyalty.field.pointsPrecision", "Points precision"),
            t(
              "loyalty.helper.pointsPrecision",
              "Decimal precision to render and validate point amounts."
            )
          )}
          {integerField(
            "moneyPrecision",
            t("loyalty.field.moneyPrecision", "Money precision"),
            t("loyalty.helper.moneyPrecision", "Decimal precision for monetary amounts.")
          )}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              {t("loyalty.field.roundingMode", "Rounding mode")}
            </label>
            <select
              {...register("roundingMode")}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              disabled={readOnly}
            >
              {LOYALTY_ROUNDING_MODE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey, option.value)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {t("loyalty.settings.section.audit", "Change reason")}
          </h2>
          <p className="text-sm text-slate-500">
            {t(
              "loyalty.helper.reason",
              "Reason is required for settings updates and is expected by the backend API."
            )}
          </p>
        </div>
        <textarea
          {...register("reason")}
          className="min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          placeholder={t("loyalty.placeholder.reason", "Annual loyalty policy update")}
          disabled={readOnly}
        />
        <FieldError message={errors.reason?.message} />
      </section>

      {!isEnabled ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {t(
            "loyalty.disabled.banner",
            "The loyalty program is currently disabled. Reports stay visible, but customer accrual and redemption should be considered inactive."
          )}
        </div>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => reset(initialValues ?? loyaltySettingsDefaults)}
          disabled={pending || !isDirty}
        >
          {t("common.reset", "Reset")}
        </Button>
        <Button type="submit" disabled={submitDisabled}>
          {pending ? t("common.updating", "Updating...") : t("common.saveChanges", "Save Changes")}
        </Button>
      </div>
    </form>
  );
}
