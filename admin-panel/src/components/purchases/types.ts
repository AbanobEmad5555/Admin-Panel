export type PurchaseStatus = "ORDERED" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";

export type PurchaseRow = {
  id: string;
  purchaseId: string;
  productId?: number | null;
  productName: string;
  productNameEn?: string;
  productNameAr?: string;
  categoryId?: number | null;
  categoryName?: string;
  categoryNameEn?: string;
  categoryNameAr?: string;
  variantId?: number | null;
  variantName?: string;
  supplierName: string;
  supplierNameEn?: string;
  supplierNameAr?: string;
  supplierContact?: string;
  supplierEmail?: string;
  supplierPhone?: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  expectedArrivalDate: string;
  deliveredAt?: string;
  pendingApproval?: boolean;
  inventorySyncedAt?: string;
  inventorySyncedQuantity?: number;
  status: PurchaseStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type CostCategory =
  | "RENT"
  | "UTILITIES"
  | "SALARY"
  | "MARKETING"
  | "SHIPPING"
  | "MISCELLANEOUS";

export type CostRow = {
  id: string;
  name: string;
  costNameEn?: string;
  costNameAr?: string;
  category: CostCategory;
  amount: number;
  date: string;
  notes: string;
  createdAt?: string;
  updatedAt?: string;
};

export type PurchaseFormMode = "existing" | "new";

export type PurchaseFormValue = {
  productMode: PurchaseFormMode;
  existingProductId: string;
  productNameEn: string;
  productNameAr: string;
  selectedCategoryId: string;
  categoryEn: string;
  categoryAr: string;
  selectedVariantId: string;
  variant: string;
  priceBeforeDiscount: string;
  priceAfterDiscount: string;
  supplierNameEn: string;
  supplierNameAr: string;
  supplierContact: string;
  supplierEmail: string;
  supplierPhone: string;
  quantity: string;
  unitCost: string;
  expectedArrivalDate: string;
  status: PurchaseStatus;
};

export type CostFormValue = {
  costNameEn: string;
  costNameAr: string;
  category: CostCategory;
  amount: string;
  date: string;
  notes: string;
};
