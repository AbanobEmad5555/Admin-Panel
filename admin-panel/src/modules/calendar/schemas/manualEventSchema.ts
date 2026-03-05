import { z } from "zod";

export const manualEventSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required"),
    description: z.string().trim().optional(),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    color: z
      .string()
      .trim()
      .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid HEX value"),
  })
  .superRefine((values, ctx) => {
    const start = new Date(values.startDate);
    const end = new Date(values.endDate);

    if (Number.isNaN(start.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["startDate"],
        message: "Invalid start date",
      });
      return;
    }

    if (Number.isNaN(end.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "Invalid end date",
      });
      return;
    }

    if (end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "End date must be after start date",
      });
    }
  });

export type ManualEventFormValues = z.infer<typeof manualEventSchema>;
