"use client";

import type { ReactNode } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

type ConfirmDeleteModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: ReactNode;
  isLoading?: boolean;
};

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm delete",
  message = "This action cannot be undone.",
  isLoading = false,
}: ConfirmDeleteModalProps) {
  const { language } = useLocalization();
  const text =
    language === "ar"
      ? {
          cancel: "إلغاء",
          deleting: "جارٍ الحذف...",
          delete: "حذف",
        }
      : {
          cancel: "Cancel",
          deleting: "Deleting...",
          delete: "Delete",
        };
  return (
    <Modal title={title} isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-slate-600">{message}</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            {text.cancel}
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? text.deleting : text.delete}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
