import { z } from "zod";

const deliveryMethodConfigSchema = z.object({
  deliveryDays: z.number().int().min(0, "Must be 0 or more"),
  deliveryCost: z.number().min(0, "Must be 0 or more"),
});

export const deliverySettingsSchema = z.object({
  defaultDeliveryMethod: z.enum(["STANDARD", "EXPRESS"]),
  STANDARD: deliveryMethodConfigSchema,
  EXPRESS: deliveryMethodConfigSchema,
});

export type DeliverySettingsFormValues = z.infer<typeof deliverySettingsSchema>;
