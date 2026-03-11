import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

type ConfirmDeleteModalProps = {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
  onConfirm: () => void;
};

export default function ConfirmDeleteModal({
  open,
  title,
  description,
  onClose,
  onConfirm,
}: ConfirmDeleteModalProps) {
  const { language } = useLocalization();
  return (
    <Modal title={title} isOpen={open} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-slate-600">{description}</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            {language === "ar" ? "إلغاء" : "Cancel"}
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {language === "ar" ? "حذف" : "Delete"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
