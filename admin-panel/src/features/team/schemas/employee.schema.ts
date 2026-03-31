import { z } from "zod";

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
const isHttpUrl = (value?: string) => !value || /^https?:\/\//i.test(value);
const isUrlOrData = (value?: string) =>
  !value || /^https?:\/\//i.test(value) || /^data:/i.test(value);

export const employeeRoleSchema = z.enum(["ADMIN", "MANAGER", "CASHIER", "EMPLOYEE"]);
export const employeeStatusSchema = z.enum(["ACTIVE", "SUSPENDED", "VACATION", "TERMINATED"]);
export const staffAccountStatusSchema = z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]);
export const employmentTypeSchema = z.enum(["FULL_TIME", "PART_TIME", "TRAINEE"]);
export const employeeSortSchema = z.enum([
  "name_asc",
  "name_desc",
  "salary_asc",
  "salary_desc",
  "rating_desc",
]);
export const workingDaySchema = z.enum(["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]);
export const documentTypeSchema = z.enum(["CONTRACT", "ID", "CERTIFICATE", "OTHER"]);

export const employeeFormSchema = z.object({
  fullNameEn: z.string().trim().min(1, "Full name (English) is required"),
  fullNameAr: z.string().trim().optional().or(z.literal("")),
  role: employeeRoleSchema,
  salary: z.coerce.number().min(0, "Salary must be >= 0"),
  currency: z.string().trim().min(1, "Currency is required"),
  email: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || z.string().email().safeParse(value).success, "Invalid email"),
  phone: z.string().trim().optional().or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
  titleEn: z.string().trim().optional().or(z.literal("")),
  titleAr: z.string().trim().optional().or(z.literal("")),
  employmentType: employmentTypeSchema.optional(),
  departmentEn: z.string().trim().optional().or(z.literal("")),
  departmentAr: z.string().trim().optional().or(z.literal("")),
  profileImageUrl: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((value) => isHttpUrl(value), "Invalid image URL"),
  hireDate: z.string().optional().or(z.literal("")),
  shiftStart: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || timePattern.test(value), "shiftStart must be HH:mm"),
  shiftEnd: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || timePattern.test(value), "shiftEnd must be HH:mm"),
  workingDays: z.array(workingDaySchema).min(1, "Select at least one working day"),
  rating: z
    .union([z.string(), z.number(), z.undefined()])
    .transform((value) => (value === undefined || value === "" ? undefined : Number(value)))
    .refine((value) => value === undefined || (!Number.isNaN(value) && value >= 0 && value <= 5), "Rating must be between 0 and 5")
    .refine((value) => value === undefined || Number.isInteger(value * 2), "Rating must use 0.5 steps"),
  notes: z.string().trim().optional().or(z.literal("")),
  account: z
    .object({
      createLogin: z.boolean().default(false),
      email: z
        .string()
        .trim()
        .optional()
        .or(z.literal(""))
        .refine((value) => !value || z.string().email().safeParse(value).success, "Invalid login email"),
      phone: z.string().trim().optional().or(z.literal("")),
      roleId: z.string().trim().optional().or(z.literal("")),
      staffAccountStatus: staffAccountStatusSchema.optional(),
      activateLogin: z.boolean().optional(),
      deactivateLogin: z.boolean().optional(),
    })
    .optional()
    .superRefine((account, ctx) => {
      if (!account?.createLogin && !account?.activateLogin && !account?.deactivateLogin) {
        return;
      }

      if (!account.email) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["email"],
          message: "Login email is required when account access is enabled.",
        });
      }

      if (!account.roleId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["roleId"],
          message: "Staff role is required when account access is enabled.",
        });
      }
    }),
});

export const statusChangeSchema = z
  .object({
    status: employeeStatusSchema,
    reason: z.string().trim().optional().or(z.literal("")),
  })
  .superRefine((value, ctx) => {
    if ((value.status === "SUSPENDED" || value.status === "TERMINATED") && !value.reason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["reason"],
        message: "Reason is required for suspended/terminated.",
      });
    }
  });

export const uploadDocumentSchema = z.object({
  type: documentTypeSchema,
  title: z.string().trim().min(1, "Title is required"),
  fileUrl: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((value) => isUrlOrData(value), "Valid URL is required"),
  otherTypeLabel: z.string().trim().optional().or(z.literal("")),
  expiresAt: z.string().optional().or(z.literal("")),
}).superRefine((value, ctx) => {
  if (value.type === "OTHER" && !value.otherTypeLabel) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["otherTypeLabel"],
      message: "Please specify the other document type.",
    });
  }
});

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;
export type StatusChangeValues = z.infer<typeof statusChangeSchema>;
export type UploadDocumentValues = z.infer<typeof uploadDocumentSchema>;
