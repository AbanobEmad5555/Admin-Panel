import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

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
  return (
    <Modal title={title} isOpen={open} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-slate-600">{description}</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}
