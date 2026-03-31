import Badge from "@/components/ui/Badge";
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

  const tone =
    value === "AVAILABLE" || value === "EARN" || value === "MANUAL_ADD"
      ? "success"
      : value === "PENDING"
        ? "warning"
        : value === "EXPIRED" || value === "MANUAL_EXPIRE" || value === "RESET"
          ? "danger"
          : value === "CONSUMED"
            ? "info"
            : "neutral";

  return <Badge tone={tone}>{label}</Badge>;
}
