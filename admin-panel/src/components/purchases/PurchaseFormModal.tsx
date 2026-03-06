"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import type { PurchaseFormValue, PurchaseRow, PurchaseStatus } from "@/components/purchases/types";

type PurchaseFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  initial?: PurchaseRow | null;
  onClose: () => void;
  onSubmit: (payload: PurchaseFormValue) => void;
};

const initialForm: PurchaseFormValue = {
  productMode: "existing",
  existingProductId: "",
  productName: "",
  category: "",
  variant: "",
  priceBeforeDiscount: "",
  priceAfterDiscount: "",
  supplierName: "",
  supplierContact: "",
  supplierEmail: "",
  supplierPhone: "",
  quantity: "",
  unitCost: "",
  expectedArrivalDate: "",
  status: "ORDERED",
};

const statuses: PurchaseStatus[] = ["ORDERED", "IN_TRANSIT", "DELIVERED", "CANCELLED"];
const categories = ["Hoodies", "Jackets", "Shoes", "Accessories", "T-Shirts"];
const variants = ["S", "M", "L", "XL", "42", "43"];

const toFormValue = (initial?: PurchaseRow | null): PurchaseFormValue => {
  if (!initial) {
    return initialForm;
  }

  return {
    productMode: "existing",
    existingProductId: initial.productName,
    productName: initial.productName,
    category: "",
    variant: "",
    priceBeforeDiscount: "",
    priceAfterDiscount: "",
    supplierName: initial.supplier,
    supplierContact: "",
    supplierEmail: "",
    supplierPhone: "",
    quantity: String(initial.quantity),
    unitCost: String(initial.unitCost),
    expectedArrivalDate: initial.expectedArrival,
    status: initial.status,
  };
};

export default function PurchaseFormModal({
  open,
  mode,
  initial,
  onClose,
  onSubmit,
}: PurchaseFormModalProps) {
  const [form, setForm] = useState<PurchaseFormValue>(() => toFormValue(initial));

  return (
    <Modal
      title={mode === "create" ? "Add Purchase" : "Edit Purchase"}
      isOpen={open}
      onClose={onClose}
    >
      <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Product Selection</label>
          <div className="flex items-center gap-4 rounded-md border border-slate-200 bg-slate-50 p-2">
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="radio"
                name="productMode"
                checked={form.productMode === "existing"}
                onChange={() => setForm((prev) => ({ ...prev, productMode: "existing" }))}
                className="h-4 w-4 accent-slate-900"
              />
              Existing Product
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="radio"
                name="productMode"
                checked={form.productMode === "new"}
                onChange={() => setForm((prev) => ({ ...prev, productMode: "new" }))}
                className="h-4 w-4 accent-slate-900"
              />
              New Product
            </label>
          </div>
        </div>

        {form.productMode === "existing" ? (
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Product</label>
            <select
              value={form.existingProductId}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  existingProductId: event.target.value,
                  productName: event.target.value,
                }))
              }
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              <option value="">Select product</option>
              <option value="Classic Hoodie - Black / L">Classic Hoodie - Black / L</option>
              <option value="Denim Jacket - Blue / M">Denim Jacket - Blue / M</option>
              <option value="Sneakers Pro - White / 42">Sneakers Pro - White / 42</option>
            </select>
          </div>
        ) : (
          <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <Input
              placeholder="Product Name"
              value={form.productName}
              onChange={(event) => setForm((prev) => ({ ...prev, productName: event.target.value }))}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <select
                value={form.category}
                onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <select
                value={form.variant}
                onChange={(event) => setForm((prev) => ({ ...prev, variant: event.target.value }))}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="">Select variant</option>
                {variants.map((variant) => (
                  <option key={variant} value={variant}>
                    {variant}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                type="number"
                placeholder="Price Before Discount"
                value={form.priceBeforeDiscount}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, priceBeforeDiscount: event.target.value }))
                }
              />
              <Input
                type="number"
                placeholder="Price After Discount"
                value={form.priceAfterDiscount}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, priceAfterDiscount: event.target.value }))
                }
              />
            </div>
          </div>
        )}

        <div className="space-y-3 rounded-lg border border-slate-200 p-3">
          <h3 className="text-sm font-semibold text-slate-900">Supplier Information</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              placeholder="Supplier Name"
              value={form.supplierName}
              onChange={(event) => setForm((prev) => ({ ...prev, supplierName: event.target.value }))}
            />
            <Input
              placeholder="Supplier Contact"
              value={form.supplierContact}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, supplierContact: event.target.value }))
              }
            />
            <Input
              placeholder="Supplier Email"
              type="email"
              value={form.supplierEmail}
              onChange={(event) => setForm((prev) => ({ ...prev, supplierEmail: event.target.value }))}
            />
            <Input
              placeholder="Supplier Phone"
              value={form.supplierPhone}
              onChange={(event) => setForm((prev) => ({ ...prev, supplierPhone: event.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-slate-200 p-3">
          <h3 className="text-sm font-semibold text-slate-900">Purchase Details</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              type="number"
              placeholder="Quantity"
              value={form.quantity}
              onChange={(event) => setForm((prev) => ({ ...prev, quantity: event.target.value }))}
            />
            <Input
              type="number"
              placeholder="Unit Cost"
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
                  {status}
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
            Cancel
          </Button>
          <Button type="button" onClick={() => onSubmit(form)}>
            {mode === "create" ? "Add Purchase" : "Save Changes"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
