import { z } from "zod";
import type { LoyaltySettingsFormValues } from "@/features/loyalty/types";

export const DECIMAL_INPUT_REGEX = /^\d+(\.\d+)?$/;

const decimalString = (messageKey: string) =>
  z
    .string()
    .trim()
    .min(1, messageKey)
    .regex(DECIMAL_INPUT_REGEX, messageKey);

const integerNumber = (messageKey: string) =>
  z
    .number({ error: messageKey })
    .int(messageKey)
    .nonnegative(messageKey);

export const loyaltySettingsSchema = z
  .object({
    isEnabled: z.boolean(),
    earnAmount: decimalString("loyalty.validation.decimal"),
    earnPoints: decimalString("loyalty.validation.decimal"),
    redeemPoints: decimalString("loyalty.validation.decimal"),
    redeemAmount: decimalString("loyalty.validation.decimal"),
    expirationDays: integerNumber("loyalty.validation.integer"),
    pointsPrecision: integerNumber("loyalty.validation.integer").min(0).max(6),
    moneyPrecision: integerNumber("loyalty.validation.integer").min(0).max(4),
    roundingMode: z.enum(["HALF_UP", "HALF_DOWN", "UP", "DOWN", "HALF_EVEN"]),
    minRedeemPoints: decimalString("loyalty.validation.decimal"),
    maxRedeemPointsPerOrder: decimalString("loyalty.validation.decimal"),
    minPayableAmountAfterRedeem: decimalString("loyalty.validation.decimal"),
    expiringSoonThresholdDays: integerNumber("loyalty.validation.integer"),
    earnBase: z.enum(["PRODUCT_SUBTOTAL", "ORDER_SUBTOTAL"]),
    allowPromoCodeStacking: z.boolean(),
    allowManualDiscountStacking: z.boolean(),
    reason: z.string().trim().min(3, "loyalty.validation.reasonRequired"),
  })
  .superRefine((values, ctx) => {
    if (values.minRedeemPoints && values.maxRedeemPointsPerOrder) {
      const min = Number(values.minRedeemPoints);
      const max = Number(values.maxRedeemPointsPerOrder);
      if (Number.isFinite(min) && Number.isFinite(max) && min > max) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["maxRedeemPointsPerOrder"],
          message: "loyalty.validation.maxRedeemGteMin",
        });
      }
    }
  });

export const loyaltySettingsDefaults: LoyaltySettingsFormValues = {
  isEnabled: false,
  earnAmount: "1.00",
  earnPoints: "1.000",
  redeemPoints: "10.000",
  redeemAmount: "1.00",
  expirationDays: 365,
  pointsPrecision: 3,
  moneyPrecision: 2,
  roundingMode: "HALF_UP",
  minRedeemPoints: "50.000",
  maxRedeemPointsPerOrder: "1000.000",
  minPayableAmountAfterRedeem: "10.00",
  expiringSoonThresholdDays: 7,
  earnBase: "PRODUCT_SUBTOTAL",
  allowPromoCodeStacking: false,
  allowManualDiscountStacking: true,
  reason: "",
};
