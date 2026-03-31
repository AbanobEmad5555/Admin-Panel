"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
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

  if (!isOpen) {
    return null;
  }

  const titleId = `modal-title-${title.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4"
      dir={direction}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`my-auto max-h-[90vh] w-full overflow-hidden rounded-lg bg-white shadow-lg ${panelClassName}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 id={titleId} className="text-base font-semibold text-slate-900">
            {title}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              {t("common.cancel", "Close")}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("common.close", "Close")}
              className="rounded-md p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="max-h-[calc(90vh-4.5rem)] overflow-y-auto px-4 py-4">{children}</div>
      </div>
    </div>
  );
}
