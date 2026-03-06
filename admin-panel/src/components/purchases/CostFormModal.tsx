"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { costCategories } from "@/components/purchases/mock-data";
import type { CostFormValue, CostRow } from "@/components/purchases/types";

type CostFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  initial?: CostRow | null;
  onClose: () => void;
  onSubmit: (payload: CostFormValue) => void;
};

const emptyForm: CostFormValue = {
  name: "",
  category: "Miscellaneous",
  amount: "",
  date: "",
  notes: "",
};

const toFormValue = (initial?: CostRow | null): CostFormValue => {
  if (!initial) {
    return emptyForm;
  }
  return {
    name: initial.name,
    category: initial.category,
    amount: String(initial.amount),
    date: initial.date,
    notes: initial.notes,
  };
};

export default function CostFormModal({
  open,
  mode,
  initial,
  onClose,
  onSubmit,
}: CostFormModalProps) {
  const [form, setForm] = useState<CostFormValue>(() => toFormValue(initial));

  return (
    <Modal title={mode === "create" ? "Add Cost" : "Edit Cost"} isOpen={open} onClose={onClose}>
      <div className="space-y-4">
        <Input
          placeholder="Cost Name"
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            value={form.category}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, category: event.target.value as CostRow["category"] }))
            }
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            {costCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <Input
            type="number"
            placeholder="Amount in EGP"
            value={form.amount}
            onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
          />
        </div>
        <Input
          type="date"
          value={form.date}
          onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
          onClick={(event) => event.currentTarget.showPicker?.()}
          className="cursor-pointer"
        />
        <textarea
          value={form.notes}
          onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
          placeholder="Notes"
          className="min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
        />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSubmit(form)}>
            {mode === "create" ? "Add Cost" : "Save Changes"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
