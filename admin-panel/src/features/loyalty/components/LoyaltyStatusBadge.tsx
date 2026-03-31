import { useLocalization } from "@/modules/localization/LocalizationProvider";
import {
  getTransactionSourceLabel,
  getTransactionStatusLabel,
  getTransactionTypeLabel,
} from "@/features/loyalty/utils/formatters";
import type {
  LoyaltyTransactionSource,
  LoyaltyTransactionStatus,
  LoyaltyTransactionType,
} from "@/features/loyalty/types";

type BadgeVariant = "type" | "status" | "source";

type LoyaltyBadgeProps = {
  value: LoyaltyTransactionType | LoyaltyTransactionStatus | LoyaltyTransactionSource;
  variant: BadgeVariant;
};

export function LoyaltyStatusBadge({ value, variant }: LoyaltyBadgeProps) {
  const { t } = useLocalization();

  const label =
    variant === "type"
      ? getTransactionTypeLabel(value as LoyaltyTransactionType, t)
      : variant === "status"
        ? getTransactionStatusLabel(value as LoyaltyTransactionStatus, t)
        : getTransactionSourceLabel(value as LoyaltyTransactionSource, t);

  const toneClass =
    value === "AVAILABLE" || value === "EARN" || value === "MANUAL_ADD"
      ? "bg-emerald-100 text-emerald-700"
      : value === "PENDING"
        ? "bg-amber-100 text-amber-700"
        : value === "EXPIRED" || value === "MANUAL_EXPIRE" || value === "RESET"
          ? "bg-rose-100 text-rose-700"
          : value === "CONSUMED"
            ? "bg-sky-100 text-sky-700"
          : "bg-slate-100 text-slate-700";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${toneClass}`}>
      {label}
    </span>
  );
}
