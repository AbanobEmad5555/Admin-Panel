"use client";

import { useState } from "react";
import { purchaseStatuses } from "@/components/purchases/constants";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import type { PurchaseFormValue, PurchaseRow, PurchaseStatus } from "@/components/purchases/types";
import BilingualTextField from "@/modules/shared/components/BilingualTextField";
import LocalizedFormSection from "@/modules/shared/components/LocalizedFormSection";
import { useLocalization } from "@/modules/localization/LocalizationProvider";
import { useForm } from "react-hook-form";

type ProductOption = {
  id: number;
  label: string;
};

type CategoryOption = {
  id: number;
  name: string;
};

type VariantOption = {
  id: number;
  label: string;
};

type PurchaseFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  initial?: PurchaseRow | null;
  existingProducts: ProductOption[];
  categories: CategoryOption[];
  variants: VariantOption[];
  catalogLoading?: boolean;
  onClose: () => void;
  onSubmit: (payload: PurchaseFormValue) => void;
};

const initialForm: PurchaseFormValue = {
  productMode: "existing",
  existingProductId: "",
  productNameEn: "",
  productNameAr: "",
  selectedCategoryId: "",
  categoryEn: "",
  categoryAr: "",
  selectedVariantId: "",
  variant: "",
  priceBeforeDiscount: "",
  priceAfterDiscount: "",
  supplierNameEn: "",
  supplierNameAr: "",
  supplierContact: "",
  supplierEmail: "",
  supplierPhone: "",
  quantity: "",
  unitCost: "",
  expectedArrivalDate: "",
  status: "ORDERED",
};

const statuses: PurchaseStatus[] = purchaseStatuses;

const toFormValue = (initial?: PurchaseRow | null): PurchaseFormValue => {
  if (!initial) {
    return initialForm;
  }

  return {
    productMode: "existing",
    existingProductId: initial.productId ? String(initial.productId) : "",
    productNameEn: initial.productNameEn ?? initial.productName,
    productNameAr: initial.productNameAr ?? "",
    selectedCategoryId: initial.categoryId ? String(initial.categoryId) : "",
    categoryEn: initial.categoryNameEn ?? initial.categoryName ?? "",
    categoryAr: initial.categoryNameAr ?? "",
    selectedVariantId: initial.variantId ? String(initial.variantId) : "",
    variant: initial.variantName ?? "",
    priceBeforeDiscount: "",
    priceAfterDiscount: "",
    supplierNameEn: initial.supplierNameEn ?? initial.supplierName,
    supplierNameAr: initial.supplierNameAr ?? "",
    supplierContact: initial.supplierContact ?? "",
    supplierEmail: initial.supplierEmail ?? "",
    supplierPhone: initial.supplierPhone ?? "",
    quantity: String(initial.quantity),
    unitCost: String(initial.unitCost),
    expectedArrivalDate: initial.expectedArrivalDate,
    status: initial.status,
  };
};

export default function PurchaseFormModal({
  open,
  mode,
  initial,
  existingProducts,
  categories,
  variants,
  catalogLoading = false,
  onClose,
  onSubmit,
}: PurchaseFormModalProps) {
  const { t } = useLocalization();
  const text = {
    title: mode === "create" ? (t("action.addPurchase") || "Add Purchase") : (t("action.edit") || "Edit Purchase"),
    productSelection: t("field.productSelection") || "Product Selection",
    existingProduct: t("field.existingProduct") || "Existing Product",
    newProduct: t("field.newProduct") || "New Product",
    product: t("field.product") || "Product",
    selectProduct: t("placeholder.selectProduct") || "Select product",
    noProducts: t("empty.noProducts") || "No products found.",
    selectCategory: t("placeholder.selectCategory") || "Select category",
    selectVariant: t("placeholder.selectVariant") || "Select variant",
    noCategories: t("empty.noCategories") || "No categories found.",
    noVariants: t("empty.noVariants") || "No variants found.",
    priceBeforeDiscount: t("field.priceBeforeDiscount") || "Price Before Discount",
    priceAfterDiscount: t("field.priceAfterDiscount") || "Price After Discount",
    supplierInfo: t("section.supplierInfo") || "Supplier Information",
    supplierContact: t("field.supplierContact") || "Supplier Contact",
    supplierEmail: t("field.supplierEmail") || "Supplier Email",
    supplierPhone: t("field.supplierPhone") || "Supplier Phone",
    purchaseDetails: t("section.purchaseDetails") || "Purchase Details",
    quantity: t("field.quantity") || "Quantity",
    unitCost: t("field.unitCost") || "Unit Cost",
    expectedArrivalDate: t("field.expectedArrivalDate") || "Expected Arrival Date",
    cancel: t("action.cancel") || "Cancel",
    addPurchase: t("action.addPurchase") || "Add Purchase",
    saveChanges: t("action.saveChanges") || "Save Changes",
    statusLabels: {
      ORDERED: t("status.ordered") || "Ordered",
      IN_TRANSIT: t("status.inTransit") || "In Transit",
      DELIVERED: t("status.delivered") || "Delivered",
      CANCELLED: t("status.cancelled") || "Cancelled",
    } satisfies Record<PurchaseStatus, string>,
  };
  const [form, setForm] = useState<PurchaseFormValue>(() => toFormValue(initial));
  const hookForm = useForm<PurchaseFormValue>({ values: form });

  return (
    <Modal
      title={text.title}
      isOpen={open}
      onClose={onClose}
    >
      <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{text.productSelection}</label>
          <div className="flex items-center gap-4 rounded-md border border-slate-200 bg-slate-50 p-2">
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="radio"
                name="productMode"
                checked={form.productMode === "existing"}
                onChange={() => setForm((prev) => ({ ...prev, productMode: "existing" }))}
                className="h-4 w-4 accent-slate-900"
              />
              {text.existingProduct}
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="radio"
                name="productMode"
                checked={form.productMode === "new"}
                onChange={() => setForm((prev) => ({ ...prev, productMode: "new" }))}
                className="h-4 w-4 accent-slate-900"
              />
              {text.newProduct}
            </label>
          </div>
        </div>

        {form.productMode === "existing" ? (
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{text.product}</label>
            <select
              value={form.existingProductId}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  existingProductId: event.target.value,
                }))
              }
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              <option value="">{text.selectProduct}</option>
              {existingProducts.map((product) => (
                <option key={product.id} value={String(product.id)}>
                  {product.label}
                </option>
              ))}
            </select>
            {!catalogLoading && existingProducts.length === 0 ? (
              <p className="text-xs text-slate-500">{text.noProducts}</p>
            ) : null}
          </div>
        ) : (
          <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <LocalizedFormSection title={t("field.productName")}>
              <div
                onChange={() =>
                  setForm((prev) => ({ ...prev, ...hookForm.getValues() }))
                }
              >
                <BilingualTextField
                  register={hookForm.register}
                  nameEnField="productNameEn"
                  nameArField="productNameAr"
                  label={t("field.productName")}
                  requiredEn
                />
              </div>
            </LocalizedFormSection>
            <div className="grid gap-3 sm:grid-cols-2">
              <select
                value={form.selectedCategoryId}
                onChange={(event) => {
                  const selected = categories.find(
                    (category) => String(category.id) === event.target.value
                  );
                  setForm((prev) => ({
                    ...prev,
                    selectedCategoryId: event.target.value,
                    categoryEn: selected?.name ?? "",
                  }));
                }}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="">{text.selectCategory}</option>
                {categories.map((category) => (
                  <option key={category.id} value={String(category.id)}>
                    {category.name}
                  </option>
                ))}
              </select>
              <select
                value={form.selectedVariantId}
                onChange={(event) => {
                  const selected = variants.find(
                    (variant) => String(variant.id) === event.target.value
                  );
                  setForm((prev) => ({
                    ...prev,
                    selectedVariantId: event.target.value,
                    variant: selected?.label ?? "",
                  }));
                }}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="">{text.selectVariant}</option>
                {variants.map((variant) => (
                  <option key={variant.id} value={String(variant.id)}>
                    {variant.label}
                  </option>
                ))}
              </select>
            </div>
            {!catalogLoading && categories.length === 0 ? (
              <p className="text-xs text-slate-500">{text.noCategories}</p>
            ) : null}
            {!catalogLoading && variants.length === 0 ? (
              <p className="text-xs text-slate-500">{text.noVariants}</p>
            ) : null}
            <LocalizedFormSection title={t("field.categoryName")}>
              <div
                onChange={() =>
                  setForm((prev) => ({ ...prev, ...hookForm.getValues() }))
                }
              >
                <BilingualTextField
                  register={hookForm.register}
                  nameEnField="categoryEn"
                  nameArField="categoryAr"
                  label={t("field.categoryName")}
                />
              </div>
            </LocalizedFormSection>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                type="number"
                placeholder={text.priceBeforeDiscount}
                value={form.priceBeforeDiscount}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, priceBeforeDiscount: event.target.value }))
                }
              />
              <Input
                type="number"
                placeholder={text.priceAfterDiscount}
                value={form.priceAfterDiscount}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, priceAfterDiscount: event.target.value }))
                }
              />
            </div>
          </div>
        )}

        <div className="space-y-3 rounded-lg border border-slate-200 p-3">
          <h3 className="text-sm font-semibold text-slate-900">{text.supplierInfo}</h3>
          <LocalizedFormSection title={t("field.supplierName")}>
            <div
              onChange={() =>
                setForm((prev) => ({ ...prev, ...hookForm.getValues() }))
              }
            >
              <BilingualTextField
                register={hookForm.register}
                nameEnField="supplierNameEn"
                nameArField="supplierNameAr"
                label={t("field.supplierName")}
                requiredEn
              />
            </div>
          </LocalizedFormSection>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              placeholder={text.supplierContact}
              value={form.supplierContact}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, supplierContact: event.target.value }))
              }
            />
            <Input
              placeholder={text.supplierEmail}
              type="email"
              value={form.supplierEmail}
              onChange={(event) => setForm((prev) => ({ ...prev, supplierEmail: event.target.value }))}
            />
            <Input
              placeholder={text.supplierPhone}
              value={form.supplierPhone}
              onChange={(event) => setForm((prev) => ({ ...prev, supplierPhone: event.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-slate-200 p-3">
          <h3 className="text-sm font-semibold text-slate-900">{text.purchaseDetails}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              type="number"
              placeholder={text.quantity}
              value={form.quantity}
              onChange={(event) => setForm((prev) => ({ ...prev, quantity: event.target.value }))}
            />
            <Input
              type="number"
              placeholder={text.unitCost}
              value={form.unitCost}
              onChange={(event) => setForm((prev) => ({ ...prev, unitCost: event.target.value }))}
            />
            <select
              value={form.status}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  status: event.target.value as PurchaseStatus,
                  expectedArrivalDate:
                    event.target.value === "IN_TRANSIT" ? prev.expectedArrivalDate : "",
                }))
              }
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {text.statusLabels[status]}
                </option>
              ))}
            </select>
            {form.status === "IN_TRANSIT" ? (
              <Input
                type="date"
                value={form.expectedArrivalDate}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, expectedArrivalDate: event.target.value }))
                }
                onClick={(event) => event.currentTarget.showPicker?.()}
                className="cursor-pointer sm:col-span-2"
              />
            ) : null}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            {text.cancel}
          </Button>
          <Button type="button" onClick={() => onSubmit(form)}>
            {mode === "create" ? text.addPurchase : text.saveChanges}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
