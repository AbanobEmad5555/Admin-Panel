import api from "@/services/api";
import type { StaffRoleSummary } from "@/features/admin-auth/types";
import { getLocalizedValue } from "@/modules/localization/utils";
import type {
  ApiEnvelope,
  ChangeEmployeeStatusInput,
  CreateEmployeeInput,
  Employee,
  EmployeeAuditLog,
  EmployeeDocument,
  EmployeeListParams,
  PaginatedResponse,
  UpdateEmployeeInput,
  UploadEmployeeDocumentInput,
} from "@/features/team/types";

const TEAM_BASE = "/api/admin/team";

const unwrap = <T>(value: unknown): T => {
  const envelope = (value ?? {}) as ApiEnvelope<T>;
  if (typeof envelope === "object" && "data" in envelope) {
    return envelope.data;
  }
  return value as T;
};

const toNumber = (value: unknown, fallback = 0) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
};

const toStringSafe = (value: unknown, fallback = "") => {
  if (value === null || value === undefined) {
    return fallback;
  }
  return String(value);
};

const firstNonEmptyString = (...values: unknown[]) => {
  for (const value of values) {
    const normalized = toStringSafe(value, "").trim();
    if (normalized) {
      return normalized;
    }
  }
  return "";
};

const normalizeWorkingDays = (value: unknown): Employee["workingDays"] => {
  if (Array.isArray(value)) {
    return value
      .map((day) => toStringSafe(day).toUpperCase())
      .filter(Boolean) as Employee["workingDays"];
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((day) => day.trim().toUpperCase())
      .filter(Boolean) as Employee["workingDays"];
  }
  return [];
};

const normalizeEmploymentType = (value: unknown): Employee["employmentType"] => {
  if (!value) {
    return null;
  }

  const raw =
    typeof value === "object"
      ? firstNonEmptyString(
          (value as Record<string, unknown>).type,
          (value as Record<string, unknown>).name,
          (value as Record<string, unknown>).value
        )
      : toStringSafe(value, "");

  const normalized = raw
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  if (normalized === "FULL_TIME") return "FULL_TIME";
  if (normalized === "PART_TIME") return "PART_TIME";
  if (normalized === "TRAINEE") return "TRAINEE";
  return null;
};

const normalizeRatingFromApi = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = toNumber(value, Number.NaN);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return Math.round(parsed * 10) / 10;
};

const normalizeRatingForApi = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }
  const parsed = toNumber(value, Number.NaN);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }
  const clampedFinal = Math.min(5, Math.max(0, parsed));
  return Math.round(clampedFinal * 10) / 10;
};

const withNormalizedRating = <T extends { rating?: unknown }>(payload: T): T => {
  const normalizedRating = normalizeRatingForApi(payload.rating);
  if (normalizedRating === undefined) {
    if ("rating" in payload) {
      return {
        ...payload,
        rating: 0,
      };
    }
    return payload;
  }
  return {
    ...payload,
    rating: normalizedRating,
  };
};

const withEmploymentTypeAliases = <T extends { employmentType?: unknown }>(payload: T): T => {
  const normalized = normalizeEmploymentType(payload.employmentType);
  if (!normalized) {
    return payload;
  }

  const enriched = {
    ...payload,
    employmentType: normalized,
    employment_type: normalized,
    contractType: normalized,
    contract_type: normalized,
    employmentTypeLabel: normalized.replace("_", " "),
  };

  return enriched as T;
};

const withBilingualEmployeeAliases = <
  T extends {
    fullNameEn?: unknown;
    fullNameAr?: unknown;
    titleEn?: unknown;
    titleAr?: unknown;
    departmentEn?: unknown;
    departmentAr?: unknown;
  },
>(
  payload: T
) =>
  ({
    ...payload,
    fullName: firstNonEmptyString(payload.fullNameEn),
    title: firstNonEmptyString(payload.titleEn),
    department: firstNonEmptyString(payload.departmentEn),
  }) as T;

const normalizeStaffRoleSummary = (value: unknown): StaffRoleSummary | null => {
  if (!value || typeof value !== "object") {
    return null;
  }
  const row = value as Record<string, unknown>;
  return {
    id: toStringSafe(row.id),
    code: toStringSafe(row.code),
    name: toStringSafe(row.name),
    isSystem: Boolean(row.isSystem),
    legacyUserRole: toStringSafe(row.legacyUserRole, "") || null,
  };
};

const normalizeEmployee = (value: unknown): Employee => {
  const row = (value ?? {}) as Record<string, unknown>;
  const fullNameEn = firstNonEmptyString(row.fullNameEn, row.full_name_en);
  const fullNameAr = firstNonEmptyString(row.fullNameAr, row.full_name_ar);
  const rawFullName = firstNonEmptyString(
    fullNameEn,
    fullNameAr,
    row.fullName,
    row.full_name,
    row.name,
    row.employeeName,
    row.employee_name
  );
  const mappedFirstName = firstNonEmptyString(row.firstName, row.first_name);
  const mappedLastName = firstNonEmptyString(row.lastName, row.last_name);
  const nameParts = rawFullName ? rawFullName.split(" ").filter(Boolean) : [];
  const firstName = mappedFirstName || nameParts[0] || null;
  const lastName =
    mappedLastName ||
    (nameParts.length > 1 ? nameParts.slice(1).join(" ") : null);
  const fullName =
    getLocalizedValue({
      en: fullNameEn,
      ar: fullNameAr,
      legacy:
        `${firstName ?? ""} ${lastName ?? ""}`.trim() || rawFullName || "-",
      lang: "en",
    }) || "-";
  const titleEn = firstNonEmptyString(row.titleEn, row.title_en, row.title);
  const titleAr = firstNonEmptyString(row.titleAr, row.title_ar);
  const departmentEn = firstNonEmptyString(
    row.departmentEn,
    row.department_en,
    row.department,
    row.departmentName,
    row.department_name,
    row.dept
  );
  const departmentAr = firstNonEmptyString(row.departmentAr, row.department_ar);
  const authAccountRaw =
    (row.authAccount ?? row.account ?? row.staffAccount ?? row.userAccount ?? null) as
      | Record<string, unknown>
      | null;

  return {
    id: toStringSafe(row.id),
    employeeCode: toStringSafe(row.employeeCode ?? row.employee_code, "") || null,
    firstName,
    lastName,
    fullName,
    fullNameEn: fullNameEn || null,
    fullNameAr: fullNameAr || null,
    role: toStringSafe(row.role, "EMPLOYEE").toUpperCase() as Employee["role"],
    status: toStringSafe(row.status, "ACTIVE").toUpperCase() as Employee["status"],
    salary: toNumber(row.salary),
    currency: toStringSafe(row.currency, "EGP"),
    email: toStringSafe(row.email, "") || null,
    phone: toStringSafe(row.phone, "") || null,
    address: toStringSafe(row.address, "") || null,
    title: titleEn || titleAr || null,
    titleEn: titleEn || null,
    titleAr: titleAr || null,
    employmentType: normalizeEmploymentType(
      row.employmentType ??
        row.employment_type ??
        row.contractType ??
        row.contract_type ??
        row.employment ??
        row.contract
    ),
    department: departmentEn || departmentAr || null,
    departmentEn: departmentEn || null,
    departmentAr: departmentAr || null,
    profileImageUrl: toStringSafe(row.profileImageUrl ?? row.profile_image_url, "") || null,
    hireDate:
      firstNonEmptyString(row.hireDate, row.hire_date, row.startDate, row.start_date) || null,
    shiftStart:
      firstNonEmptyString(row.shiftStart, row.shift_start, row.startShift, row.start_shift) || null,
    shiftEnd:
      firstNonEmptyString(row.shiftEnd, row.shift_end, row.endShift, row.end_shift) || null,
    workingDays: normalizeWorkingDays(row.workingDays ?? row.working_days),
    rating: normalizeRatingFromApi(row.rating),
    notes: toStringSafe(row.notes, "") || null,
    statusReason: toStringSafe(row.statusReason ?? row.reason, "") || null,
    createdAt: toStringSafe(row.createdAt ?? row.created_at, "") || null,
    updatedAt: toStringSafe(row.updatedAt ?? row.updated_at, "") || null,
    authAccount: authAccountRaw
      ? {
          userId: toStringSafe(authAccountRaw.userId ?? authAccountRaw.id),
          email: toStringSafe(authAccountRaw.email, "") || null,
          phone: toStringSafe(authAccountRaw.phone, "") || null,
          staffAccountStatus:
            (toStringSafe(authAccountRaw.staffAccountStatus ?? authAccountRaw.status, "") || null) as
              NonNullable<Employee["authAccount"]>["staffAccountStatus"],
          mustChangePassword: Boolean(authAccountRaw.mustChangePassword),
          role: normalizeStaffRoleSummary(authAccountRaw.role),
        }
      : null,
  };
};

const normalizePaginated = <T>(value: unknown, normalizer: (item: unknown) => T): PaginatedResponse<T> => {
  const payload = unwrap<unknown>(value);
  const row = (payload ?? {}) as Record<string, unknown>;
  const itemsRaw =
    (Array.isArray(payload) ? payload : null) ??
    (Array.isArray(row.items) ? row.items : null) ??
    (Array.isArray(row.rows) ? row.rows : null) ??
    [];

  const pagination = (row.pagination ?? {}) as Record<string, unknown>;
  const limit = Math.max(1, toNumber(row.limit ?? pagination.limit, 20));
  const page = Math.max(1, toNumber(row.page ?? pagination.currentPage, 1));
  const totalItems = Math.max(
    itemsRaw.length,
    toNumber(row.totalItems ?? row.total ?? pagination.totalItems, itemsRaw.length)
  );
  const totalPages = Math.max(1, toNumber(row.totalPages ?? pagination.totalPages, Math.ceil(totalItems / limit)));
  return {
    items: itemsRaw.map(normalizer),
    page,
    limit,
    totalItems,
    totalPages,
  };
};

const normalizeDocument = (value: unknown): EmployeeDocument => {
  const row = (value ?? {}) as Record<string, unknown>;
  return {
    id: toStringSafe(row.id),
    employeeId: toStringSafe(row.employeeId ?? row.employee_id, "") || null,
    type: toStringSafe(row.type, "OTHER").toUpperCase() as EmployeeDocument["type"],
    title: toStringSafe(row.title, "Untitled"),
    fileUrl: toStringSafe(row.fileUrl ?? row.file_url),
    expiresAt: toStringSafe(row.expiresAt ?? row.expires_at, "") || null,
    createdAt: toStringSafe(row.createdAt ?? row.created_at, "") || null,
  };
};

const normalizeAuditLog = (value: unknown): EmployeeAuditLog => {
  const row = (value ?? {}) as Record<string, unknown>;
  return {
    id: toStringSafe(row.id),
    action: toStringSafe(row.action ?? row.event, "UNKNOWN"),
    actorName: toStringSafe(row.actorName ?? row.actor_name, "") || null,
    actorRole: toStringSafe(row.actorRole ?? row.actor_role, "") || null,
    createdAt: toStringSafe(row.createdAt ?? row.created_at, "") || null,
    details: toStringSafe(row.details ?? row.reason, "") || null,
  };
};

const extractUrls = (value: unknown): string[] => {
  if (typeof value === "string" && /^https?:\/\//i.test(value)) {
    return [value];
  }
  if (Array.isArray(value)) {
    return value.flatMap((entry) => extractUrls(entry));
  }
  if (!value || typeof value !== "object") {
    return [];
  }

  const row = value as Record<string, unknown>;
  return [
    ...extractUrls(row.url),
    ...extractUrls(row.urls),
    ...extractUrls(row.fileUrl),
    ...extractUrls(row.fileUrls),
    ...extractUrls(row.data),
    ...extractUrls(row.files),
  ];
};

export const teamApi = {
  normalizeEmployee,
  async listEmployees(params: EmployeeListParams): Promise<PaginatedResponse<Employee>> {
    const response = await api.get(`${TEAM_BASE}/employees`, { params });
    return normalizePaginated(response.data, normalizeEmployee);
  },

  async getEmployee(id: string): Promise<Employee> {
    const response = await api.get(`${TEAM_BASE}/employees/${id}`);
    return normalizeEmployee(unwrap(response.data));
  },

  async createEmployee(payload: CreateEmployeeInput): Promise<Employee> {
    const response = await api.post(
      `${TEAM_BASE}/employees`,
      withBilingualEmployeeAliases(
        withEmploymentTypeAliases(withNormalizedRating(payload))
      ),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
    return normalizeEmployee(unwrap(response.data));
  },

  async updateEmployee(id: string, payload: UpdateEmployeeInput): Promise<Employee> {
    const response = await api.patch(
      `${TEAM_BASE}/employees/${id}`,
      withBilingualEmployeeAliases(
        withEmploymentTypeAliases(withNormalizedRating(payload))
      ),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
    return normalizeEmployee(unwrap(response.data));
  },

  async changeEmployeeStatus(id: string, payload: ChangeEmployeeStatusInput): Promise<Employee> {
    const response = await api.patch(`${TEAM_BASE}/employees/${id}/status`, payload, {
      headers: { "Content-Type": "application/json" },
    });
    return normalizeEmployee(unwrap(response.data));
  },

  async uploadEmployeeDocument(id: string, payload: UploadEmployeeDocumentInput): Promise<EmployeeDocument> {
    const response = await api.post(`${TEAM_BASE}/employees/${id}/documents`, payload, {
      headers: { "Content-Type": "application/json" },
    });
    return normalizeDocument(unwrap(response.data));
  },

  async uploadFiles(files: File[]): Promise<string[]> {
    if (files.length === 0) {
      return [];
    }
    const formData = new FormData();
    files.forEach((file, index) => {
      const timestamp = Date.now();
      const uniqueName = `${timestamp}-${index}-${file.name}`;
      const safeFile = new File([file], uniqueName, {
        type: file.type,
        lastModified: file.lastModified,
      });
      formData.append("images", safeFile);
    });

    const response = await api.post("/upload/product-images", formData);
    const urls = extractUrls(response.data);
    return urls.filter((url, index, all) => all.indexOf(url) === index);
  },

  async listEmployeeDocuments(id: string): Promise<EmployeeDocument[]> {
    const response = await api.get(`${TEAM_BASE}/employees/${id}/documents`);
    const payload = unwrap<unknown>(response.data);
    const rows = Array.isArray(payload)
      ? payload
      : Array.isArray((payload as { items?: unknown[] }).items)
        ? (payload as { items: unknown[] }).items
        : [];
    return rows.map(normalizeDocument);
  },

  async deleteEmployeeDocument(docId: string): Promise<void> {
    await api.delete(`${TEAM_BASE}/documents/${docId}`);
  },

  async listEmployeeAuditLogs(id: string, page = 1, limit = 20): Promise<PaginatedResponse<EmployeeAuditLog>> {
    const response = await api.get(`${TEAM_BASE}/employees/${id}/audit-logs`, {
      params: { page, limit },
    });
    return normalizePaginated(response.data, normalizeAuditLog);
  },
};
