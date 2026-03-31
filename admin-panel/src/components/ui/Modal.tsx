"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import Button from "@/components/ui/Button";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

type ModalProps = {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  panelClassName?: string;
};

export default function Modal({
  title,
  isOpen,
  onClose,
  children,
  panelClassName = "max-w-lg",
}: ModalProps) {
  const { direction, t } = useLocalization();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const titleId = `modal-title-${title.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-md"
      dir={direction}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`my-auto w-full overflow-hidden rounded-3xl border border-white/10 bg-[rgba(15,23,42,0.88)] shadow-[0_24px_70px_rgba(2,6,23,0.6),0_0_40px_rgba(56,189,248,0.14)] backdrop-blur-2xl ${panelClassName}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 id={titleId} className="text-base font-semibold tracking-[-0.02em] text-slate-50">
            {title}
          </h2>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              {t("common.cancel", "Close")}
            </Button>
            <Button
              type="button"
              onClick={onClose}
              aria-label={t("common.close", "Close")}
              variant="ghost"
              size="icon"
              className="h-9 w-9"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="max-h-[calc(90vh-5rem)] overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  );
}
