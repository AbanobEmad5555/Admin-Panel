export type PurchaseStatus = "ORDERED" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";

export type PurchaseRow = {
  id: string;
  productName: string;
  purchaseId: string;
  supplier: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  expectedArrival: string;
  delivered: boolean;
  status: PurchaseStatus;
  pendingApproval?: boolean;
};

export type CostCategory =
  | "Rent"
  | "Utilities"
  | "Salary"
  | "Marketing"
  | "Shipping"
  | "Miscellaneous";

export type CostRow = {
  id: string;
  name: string;
  category: CostCategory;
  amount: number;
  date: string;
  notes: string;
};

export type PurchaseFormMode = "existing" | "new";

export type PurchaseFormValue = {
  productMode: PurchaseFormMode;
  existingProductId: string;
  productName: string;
  category: string;
  variant: string;
  priceBeforeDiscount: string;
  priceAfterDiscount: string;
  supplierName: string;
  supplierContact: string;
  supplierEmail: string;
  supplierPhone: string;
  quantity: string;
  unitCost: string;
  expectedArrivalDate: string;
  status: PurchaseStatus;
};

export type CostFormValue = {
  name: string;
  category: CostCategory;
  amount: string;
  date: string;
  notes: string;
};
