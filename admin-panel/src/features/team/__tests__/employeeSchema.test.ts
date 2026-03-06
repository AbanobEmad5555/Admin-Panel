import { employeeFormSchema, statusChangeSchema } from "@/features/team/schemas/employee.schema";

describe("employeeFormSchema", () => {
  it("accepts valid employee payload", () => {
    const result = employeeFormSchema.safeParse({
      firstName: "Ahmed",
      lastName: "Hassan",
      role: "MANAGER",
      salary: 15000,
      currency: "EGP",
      email: "ahmed@company.com",
      shiftStart: "09:00",
      shiftEnd: "17:00",
      workingDays: ["SUN", "MON", "TUE"],
      rating: 4.5,
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid rating step", () => {
    const result = employeeFormSchema.safeParse({
      firstName: "Ahmed",
      lastName: "Hassan",
      role: "EMPLOYEE",
      salary: 1000,
      currency: "EGP",
      workingDays: ["SUN"],
      rating: 4.05,
    });

    expect(result.success).toBe(false);
  });

  it("rejects rating less than 0", () => {
    const result = employeeFormSchema.safeParse({
      firstName: "Ahmed",
      lastName: "Hassan",
      role: "EMPLOYEE",
      salary: 1000,
      currency: "EGP",
      workingDays: ["SUN"],
      rating: -0.1,
    });

    expect(result.success).toBe(false);
  });

  it("accepts rating up to 5.0 with 0.5 precision", () => {
    const low = employeeFormSchema.safeParse({
      firstName: "Ahmed",
      lastName: "Hassan",
      role: "EMPLOYEE",
      salary: 1000,
      currency: "EGP",
      workingDays: ["SUN"],
      rating: 0.5,
    });

    const high = employeeFormSchema.safeParse({
      firstName: "Ahmed",
      lastName: "Hassan",
      role: "EMPLOYEE",
      salary: 1000,
      currency: "EGP",
      workingDays: ["SUN"],
      rating: 5.0,
    });

    expect(low.success).toBe(true);
    expect(high.success).toBe(true);
  });
});

describe("statusChangeSchema", () => {
  it("requires reason for suspended", () => {
    const result = statusChangeSchema.safeParse({
      status: "SUSPENDED",
      reason: "",
    });

    expect(result.success).toBe(false);
  });
});
