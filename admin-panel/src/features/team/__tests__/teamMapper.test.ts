import { teamApi } from "@/features/team/api/team.api";

describe("team mapper", () => {
  it("normalizes employee names and nullable fields", () => {
    const normalized = teamApi.normalizeEmployee({
      id: 10,
      first_name: "Ahmed",
      last_name: "Hassan",
      role: "manager",
      status: "active",
      salary: "15000",
      currency: "EGP",
      workingDays: ["sun", "mon"],
    });

    expect(normalized.id).toBe("10");
    expect(normalized.fullName).toBe("Ahmed Hassan");
    expect(normalized.role).toBe("MANAGER");
    expect(normalized.status).toBe("ACTIVE");
    expect(normalized.salary).toBe(15000);
    expect(normalized.workingDays).toEqual(["SUN", "MON"]);
  });

  it("keeps rating scale and precision from backend", () => {
    const normalized = teamApi.normalizeEmployee({
      id: 11,
      first_name: "Mariam",
      last_name: "Fouad",
      role: "employee",
      status: "active",
      salary: "1000",
      currency: "EGP",
      workingDays: ["sun"],
      rating: 4.5,
    });

    expect(normalized.rating).toBe(4.5);
  });
});
