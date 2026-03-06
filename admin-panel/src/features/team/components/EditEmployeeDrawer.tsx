"use client";

import Modal from "@/components/ui/Modal";
import EmployeeForm from "@/features/team/components/EmployeeForm";
import type { EmployeeFormValues } from "@/features/team/schemas/employee.schema";
import type { Employee } from "@/features/team/types";

type EditEmployeeDrawerProps = {
  open: boolean;
  employee: Employee | null;
  pending?: boolean;
  onClose: () => void;
  onSubmit: (values: EmployeeFormValues) => void;
};

export default function EditEmployeeDrawer({
  open,
  employee,
  pending = false,
  onClose,
  onSubmit,
}: EditEmployeeDrawerProps) {
  return (
    <Modal title="Edit Employee" isOpen={open} onClose={onClose}>
      <div className="max-h-[75vh] overflow-y-auto pr-1">
        <EmployeeForm
          mode="edit"
          initial={employee}
          pending={pending}
          onCancel={onClose}
          onSubmit={onSubmit}
        />
      </div>
    </Modal>
  );
}
