export type LeadTag = "Potential" | "Customer" | "VIP";

export type LeadStatus =
  | "New"
  | "Contacted"
  | "Interested"
  | "Negotiating"
  | "Won"
  | "Lost";

export type LeadPriority = "Low" | "Medium" | "High";

export type User = {
  id: number;
  name: string;
  nameEn?: string;
  nameAr?: string;
  email?: string;
};

export type Lead = {
  id: number;
  name: string;
  nameEn?: string;
  nameAr?: string;
  phone: string;
  email?: string;
  source: string;
  status: LeadStatus;
  tag: LeadTag;
  tagOverride: boolean;
  priority: LeadPriority;
  assignedToId?: number;
  assignedTo?: User;
  userId?: number;
  budget?: number;
  notes?: string;
  followUpDate?: string;
  createdAt: string;
  updatedAt: string;
};

export type LeadFilters = {
  search?: string;
  status?: LeadStatus | "";
  tag?: LeadTag | "";
  priority?: LeadPriority | "";
  assignedTo?: string;
  source?: string;
};

export type LeadApiType = "CUSTOMER" | "POTENTIAL";

export type LeadListParams = {
  page: number;
  limit: number;
  search?: string;
  q?: string;
  type?: LeadApiType | "";
};

export type PaginationMeta = {
  totalItems: number;
  currentPage: number;
  totalPages: number;
  limit: number;
};

export type LeadsListResult = {
  leads: Lead[];
  pagination: PaginationMeta;
};

export type TempUserPayload = {
  tempNameEn: string;
  tempNameAr?: string;
  tempPhone: string;
  tempEmail?: string;
};

export type LeadPayload = {
  nameEn: string;
  nameAr?: string;
  phone: string;
  email?: string;
  source: string;
  status?: LeadStatus;
  priority: LeadPriority;
  assignedToId?: number;
  userId?: number;
  budget?: number;
  notes?: string;
  followUpDate?: string;
  tagOverride: boolean;
  tag?: LeadTag;
  tempUser?: TempUserPayload;
};

export type PipelineColumn = {
  status: LeadStatus;
  leads: Lead[];
};

export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message: string | null;
};

export const LEAD_STATUS_ORDER: LeadStatus[] = [
  "New",
  "Contacted",
  "Interested",
  "Negotiating",
  "Won",
  "Lost",
];

export const LEAD_TAGS: LeadTag[] = ["Potential", "Customer", "VIP"];

export const LEAD_PRIORITIES: LeadPriority[] = ["Low", "Medium", "High"];
