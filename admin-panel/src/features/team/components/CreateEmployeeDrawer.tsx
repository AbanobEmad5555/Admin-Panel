"use client";

import Modal from "@/components/ui/Modal";
import EmployeeForm from "@/features/team/components/EmployeeForm";
import type { EmployeeFormValues } from "@/features/team/schemas/employee.schema";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

type CreateEmployeeDrawerProps = {
  open: boolean;
  pending?: boolean;
  onClose: () => void;
  onSubmit: (values: EmployeeFormValues) => void;
};

export default function CreateEmployeeDrawer({
  open,
  pending = false,
  onClose,
  onSubmit,
}: CreateEmployeeDrawerProps) {
  const { language } = useLocalization();

  return (
    <Modal
      title={language === "ar" ? "إضافة موظف" : "Add Employee"}
      isOpen={open}
      onClose={onClose}
      panelClassName="max-w-4xl"
    >
      <div className="max-h-[75vh] overflow-y-auto pr-1">
        <EmployeeForm mode="create" pending={pending} onCancel={onClose} onSubmit={onSubmit} />
      </div>
    </Modal>
  );
}

