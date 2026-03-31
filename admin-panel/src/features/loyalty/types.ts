export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message: string | null;
};

export type LoyaltyPermission = "LOYALTY_VIEW" | "LOYALTY_MANAGE";

export type LoyaltyTransactionType =
  | "EARN"
  | "REDEEM"
  | "EXPIRE"
  | "ANNUL"
  | "REVERSE"
  | "MANUAL_ADD"
  | "MANUAL_DEDUCT"
  | "MANUAL_EXPIRE"
  | "RESET";

export type LoyaltyTransactionStatus =
  | "AVAILABLE"
  | "PENDING"
  | "ANNULLED"
  | "REDEEMED"
  | "EXPIRED"
  | "REVERSED"
  | "CONSUMED";

export type LoyaltyTransactionSource =
  | "ORDER"
  | "ORDER_CANCEL"
  | "CHECKOUT"
  | "REFUND"
  | "RETURN"
  | "ORDER_EDIT"
  | "ADMIN"
  | "SYSTEM_CRON";

export type LoyaltySummaryTimeRange =
  | "day"
  | "week"
  | "month"
  | "quarter"
  | "year"
  | "custom";

export type LoyaltyRoundingMode =
  | "HALF_UP"
  | "HALF_DOWN"
  | "UP"
  | "DOWN"
  | "HALF_EVEN";

export type LoyaltyEarnBase = "PRODUCT_SUBTOTAL" | "ORDER_SUBTOTAL";

export type LoyaltyUserStatus = "ACTIVE" | "INACTIVE" | "BLOCKED";

export type SelectOption<T extends string> = {
  value: T;
  labelKey: string;
};

export type LoyaltySettingsDto = {
  isEnabled: boolean;
  earnAmount: string;
  earnPoints: string;
  redeemPoints: string;
  redeemAmount: string;
  expirationDays: number;
  pointsPrecision: number;
  moneyPrecision: number;
  roundingMode: LoyaltyRoundingMode;
  minRedeemPoints: string;
  maxRedeemPointsPerOrder: string;
  minPayableAmountAfterRedeem: string;
  expiringSoonThresholdDays: number;
  earnBase: LoyaltyEarnBase;
  allowPromoCodeStacking: boolean;
  allowManualDiscountStacking: boolean;
  version?: number;
};

export type LoyaltySettingsFormValues = LoyaltySettingsDto & {
  reason: string;
};

export type LoyaltySummaryFilters = {
  dateFrom: string;
  dateTo: string;
  timeRange?: LoyaltySummaryTimeRange;
  userId?: number;
  type?: LoyaltyTransactionType;
  source?: LoyaltyTransactionSource;
  currentPointPage?: number;
  currentPointLimit?: number;
  expiringSoonPage?: number;
  expiringSoonLimit?: number;
  consumedPage?: number;
  consumedLimit?: number;
};

export type LoyaltySummaryMetric = {
  key: string;
  labelKey: string;
  value: string;
  kind: "points" | "money" | "count" | "text";
};

export type LoyaltySummaryResponse = {
  metrics: LoyaltySummaryMetric[];
  raw: Record<string, unknown>;
};

export type LoyaltyUsersQueryParams = {
  page: number;
  limit: number;
  search: string;
  status?: LoyaltyUserStatus;
  sortBy?:
    | "updatedAt"
    | "availablePoints"
    | "pendingPoints"
    | "redeemedPoints"
    | "lastLedgerAt";
  sortOrder?: "asc" | "desc";
};

export type LoyaltyUserListItemDto = {
  userId: number;
  name: string;
  email: string;
  status?: LoyaltyUserStatus;
  availablePoints: string;
  pendingPoints: string;
  redeemedPoints: string;
  expiredPoints: string;
  annulledPoints: string;
  lifetimeEarned?: string;
  lifetimeRedeemed?: string;
  lastLedgerAt: string | null;
};

export type LoyaltyUserListItem = LoyaltyUserListItemDto;

export type PaginatedResult<T> = {
  items: T[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};

export type LoyaltyUserSummaryDto = {
  userId: number;
  name?: string | null;
  email?: string | null;
  availablePoints: string;
  pendingPoints: string;
  lifetimeEarned: string;
  redeemedPoints: string;
  lifetimeRedeemed: string;
  expiredPoints: string;
  annulledPoints: string;
  lastLedgerAt?: string | null;
  expiringSoon: LoyaltyExpiringSoonItem[];
};

export type LoyaltyUserSummary = LoyaltyUserSummaryDto;

export type LoyaltyExpiringSoonItemDto = {
  id: string;
  pointsAmount: string;
  remainingPoints: string | null;
  expiresAt: string | null;
  sourceReference: string | null;
  order: {
    id: number;
    status: string;
  } | null;
};

export type LoyaltyExpiringSoonItem = LoyaltyExpiringSoonItemDto;

export type LoyaltyHistoryItemDto = {
  id: string;
  type: LoyaltyTransactionType;
  status: LoyaltyTransactionStatus;
  source: LoyaltyTransactionSource;
  pointsAmount: string;
  moneyAmount: string | null;
  remainingPoints: string | null;
  expiresAt: string | null;
  effectiveAt: string | null;
  sourceReference: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  order: {
    id: number;
    status: string;
  } | null;
  createdByAdmin: {
    id?: number | string;
    name?: string | null;
    email?: string | null;
  } | null;
  createdAt: string | null;
};

export type LoyaltyHistoryItem = LoyaltyHistoryItemDto;

export type LoyaltyOverviewCurrentAccount = {
  userId: number;
  name: string;
  email: string;
  availablePoints: string;
  pendingPoints: string;
  lifetimeEarned: string;
  redeemedPoints: string;
  lastLedgerAt: string | null;
};

export type LoyaltyOverviewExpiringAccount = {
  userId: number;
  name: string;
  email: string;
  expiringPoints: string;
  expiresAt: string | null;
  daysLeft: number;
  availablePoints: string;
  lastLedgerAt: string | null;
};

export type LoyaltyOverviewConsumedAccount = {
  userId: number;
  name: string;
  email: string;
  redeemedPoints: string;
  lifetimeRedeemed: string;
  lastLedgerAt: string | null;
};

export type LoyaltyOverviewAccounts = {
  summary: LoyaltySummaryResponse;
  currentPointUsers: PaginatedResult<LoyaltyOverviewCurrentAccount>;
  expiringSoonUsers: PaginatedResult<LoyaltyOverviewExpiringAccount>;
  consumedUsers: PaginatedResult<LoyaltyOverviewConsumedAccount>;
};

export type LoyaltyHistoryQueryParams = {
  page: number;
  limit: number;
  type?: LoyaltyTransactionType;
  status?: LoyaltyTransactionStatus;
  source?: LoyaltyTransactionSource;
  dateFrom?: string;
  dateTo?: string;
};

export type ManualAdjustmentPayload = {
  action: "MANUAL_ADD" | "MANUAL_DEDUCT";
  points: string;
  notes: string;
};

export type ManualExpirePayload = {
  points: string;
  notes: string;
};

export type ResetPayload = {
  notes: string;
  resetPending: boolean;
};

export type LoyaltyActionMode =
  | "MANUAL_ADD"
  | "MANUAL_DEDUCT"
  | "MANUAL_EXPIRE"
  | "RESET";

export const LOYALTY_TRANSACTION_TYPE_OPTIONS: SelectOption<LoyaltyTransactionType>[] = [
  { value: "EARN", labelKey: "loyalty.type.earn" },
  { value: "REDEEM", labelKey: "loyalty.type.redeem" },
  { value: "EXPIRE", labelKey: "loyalty.type.expire" },
  { value: "ANNUL", labelKey: "loyalty.type.annul" },
  { value: "REVERSE", labelKey: "loyalty.type.reverse" },
  { value: "MANUAL_ADD", labelKey: "loyalty.type.manualAdd" },
  { value: "MANUAL_DEDUCT", labelKey: "loyalty.type.manualDeduct" },
  { value: "MANUAL_EXPIRE", labelKey: "loyalty.type.manualExpire" },
  { value: "RESET", labelKey: "loyalty.type.reset" },
];

export const LOYALTY_TRANSACTION_STATUS_OPTIONS: SelectOption<LoyaltyTransactionStatus>[] = [
  { value: "AVAILABLE", labelKey: "loyalty.status.available" },
  { value: "PENDING", labelKey: "loyalty.status.pending" },
  { value: "ANNULLED", labelKey: "loyalty.status.annulled" },
  { value: "REDEEMED", labelKey: "loyalty.status.redeemed" },
  { value: "EXPIRED", labelKey: "loyalty.status.expired" },
  { value: "REVERSED", labelKey: "loyalty.status.reversed" },
  { value: "CONSUMED", labelKey: "loyalty.status.consumed" },
];

export const LOYALTY_TRANSACTION_SOURCE_OPTIONS: SelectOption<LoyaltyTransactionSource>[] = [
  { value: "ORDER", labelKey: "loyalty.source.order" },
  { value: "ORDER_CANCEL", labelKey: "loyalty.source.orderCancel" },
  { value: "CHECKOUT", labelKey: "loyalty.source.checkout" },
  { value: "REFUND", labelKey: "loyalty.source.refund" },
  { value: "RETURN", labelKey: "loyalty.source.return" },
  { value: "ORDER_EDIT", labelKey: "loyalty.source.orderEdit" },
  { value: "ADMIN", labelKey: "loyalty.source.admin" },
  { value: "SYSTEM_CRON", labelKey: "loyalty.source.systemCron" },
];

export const LOYALTY_ROUNDING_MODE_OPTIONS: SelectOption<LoyaltyRoundingMode>[] = [
  { value: "HALF_UP", labelKey: "loyalty.rounding.halfUp" },
  { value: "HALF_DOWN", labelKey: "loyalty.rounding.halfDown" },
  { value: "UP", labelKey: "loyalty.rounding.up" },
  { value: "DOWN", labelKey: "loyalty.rounding.down" },
  { value: "HALF_EVEN", labelKey: "loyalty.rounding.halfEven" },
];

export const LOYALTY_EARN_BASE_OPTIONS: SelectOption<LoyaltyEarnBase>[] = [
  { value: "PRODUCT_SUBTOTAL", labelKey: "loyalty.earnBase.productSubtotal" },
  { value: "ORDER_SUBTOTAL", labelKey: "loyalty.earnBase.orderSubtotal" },
];
