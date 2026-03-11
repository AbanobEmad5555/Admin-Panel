export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message: string | null;
};

export type TeamRole = "ADMIN" | "MANAGER" | "CASHIER" | "EMPLOYEE";
export type TeamStatus = "ACTIVE" | "SUSPENDED" | "VACATION" | "TERMINATED";
export type TeamDocumentType = "CONTRACT" | "ID" | "CERTIFICATE" | "OTHER";
export type TeamSort = "name_asc" | "name_desc" | "salary_asc" | "salary_desc" | "rating_desc";
export type WorkingDay = "SUN" | "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT";
export type EmploymentType = "FULL_TIME" | "PART_TIME" | "TRAINEE";

export type Employee = {
  id: string;
  employeeCode?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  fullName: string;
  fullNameEn?: string | null;
  fullNameAr?: string | null;
  role: TeamRole;
  status: TeamStatus;
  salary: number;
  currency: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  title?: string | null;
  titleEn?: string | null;
  titleAr?: string | null;
  employmentType?: EmploymentType | null;
  department?: string | null;
  departmentEn?: string | null;
  departmentAr?: string | null;
  profileImageUrl?: string | null;
  hireDate?: string | null;
  shiftStart?: string | null;
  shiftEnd?: string | null;
  workingDays: WorkingDay[];
  rating?: number | null;
  notes?: string | null;
  statusReason?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type EmployeeListParams = {
  page: number;
  limit: number;
  search?: string;
  role?: TeamRole | "";
  status?: TeamStatus | "";
  sort?: TeamSort;
};

export type PaginatedResponse<T> = {
  items: T[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};

export type CreateEmployeeInput = {
  fullNameEn: string;
  fullNameAr?: string;
  role: TeamRole;
  salary: number;
  currency: string;
  email?: string;
  phone?: string;
  address?: string;
  titleEn?: string;
  titleAr?: string;
  employmentType?: EmploymentType;
  departmentEn?: string;
  departmentAr?: string;
  profileImageUrl?: string | null;
  hireDate?: string;
  shiftStart?: string;
  shiftEnd?: string;
  workingDays: WorkingDay[];
  rating?: number | null;
  notes?: string;
};

export type UpdateEmployeeInput = Partial<CreateEmployeeInput> & {
  salaryChangeReason?: string;
};

export type ChangeEmployeeStatusInput = {
  status: TeamStatus;
  reason?: string | null;
};

export type EmployeeDocument = {
  id: string;
  employeeId?: string | null;
  type: TeamDocumentType;
  title: string;
  fileUrl: string;
  expiresAt?: string | null;
  createdAt?: string | null;
};

export type UploadEmployeeDocumentInput = {
  type: TeamDocumentType;
  title: string;
  fileUrl: string;
  expiresAt?: string;
};

export type EmployeeAuditLog = {
  id: string;
  action: string;
  actorName?: string | null;
  actorRole?: string | null;
  createdAt?: string | null;
  details?: string | null;
};
