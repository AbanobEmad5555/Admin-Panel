import { z } from "zod";
import {
  LEAD_PRIORITIES,
  LEAD_STATUS_ORDER,
  LEAD_TAGS,
} from "@/features/leads/types";

const leadStatusEnum = z.enum(LEAD_STATUS_ORDER);
const leadTagEnum = z.enum(LEAD_TAGS);
const leadPriorityEnum = z.enum(LEAD_PRIORITIES);

const optionalEmail = z
  .union([z.string().trim().email("Invalid email"), z.literal("")])
  .optional()
  .transform((value) => value ?? "");

export const leadSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    phone: z.string().trim().min(1, "Phone is required"),
    email: optionalEmail,
    source: z.string().trim().min(1, "Source is required"),
    status: leadStatusEnum.default("New"),
    priority: leadPriorityEnum,
    assignedToId: z.coerce.number().int().positive().optional(),
    budget: z.coerce.number().nonnegative().optional(),
    notes: z.string().trim().optional(),
    followUpDate: z
      .string()
      .optional()
      .refine((value) => !value || !Number.isNaN(new Date(value).getTime()), {
        message: "Invalid follow up date",
      }),
    customerLinkType: z.enum(["existing", "temp"]),
    userId: z.coerce.number().int().positive().optional(),
    tempName: z.string().trim().optional(),
    tempPhone: z.string().trim().optional(),
    tempEmail: optionalEmail,
    tagOverride: z.boolean().default(false),
    tag: leadTagEnum.optional(),
  })
  .superRefine((values, ctx) => {
    if (values.tagOverride && !values.tag) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tag"],
        message: "Tag is required when override is enabled",
      });
    }

    if (values.customerLinkType === "existing" && !values.userId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["userId"],
        message: "Please select an existing user",
      });
    }

    if (values.customerLinkType === "temp") {
      if (!values.tempName?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["tempName"],
          message: "Temp user name is required",
        });
      }

      if (!values.tempPhone?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["tempPhone"],
          message: "Temp user phone is required",
        });
      }
    }
  });

export type LeadFormValues = z.infer<typeof leadSchema>;
