"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import type { LoyaltyActionMode } from "@/features/loyalty/types";
import { formatPoints } from "@/features/loyalty/utils/formatters";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

type ActionFormValues = {
  points: string;
  notes: string;
  resetPending: boolean;
};

type LoyaltyActionModalProps = {
  mode: LoyaltyActionMode;
  open: boolean;
  pending?: boolean;
  availablePoints?: string;
  onClose: () => void;
  onConfirm: (values: ActionFormValues) => void;
};

export function LoyaltyActionModal({
  mode,
  open,
  pending = false,
  availablePoints,
  onClose,
  onConfirm,
}: LoyaltyActionModalProps) {
  const { t, language } = useLocalization();
  const destructive = mode === "MANUAL_EXPIRE" || mode === "RESET";
  const [points, setPoints] = useState("");
  const [notes, setNotes] = useState("");
  const [resetPending, setResetPending] = useState(false);
  const [pointsError, setPointsError] = useState<string | null>(null);
  const [notesError, setNotesError] = useState<string | null>(null);

  const title =
    mode === "MANUAL_ADD"
      ? t("loyalty.modal.manualAdd.title", "Add points")
      : mode === "MANUAL_DEDUCT"
        ? t("loyalty.modal.manualDeduct.title", "Deduct points")
        : mode === "MANUAL_EXPIRE"
          ? t("loyalty.modal.manualExpire.title", "Expire points")
          : t("loyalty.modal.reset.title", "Reset loyalty balance");

  const handleConfirm = () => {
    const normalizedPoints = points.trim();
    const normalizedNotes = notes.trim();
    const nextPointsError =
      mode !== "RESET" && !normalizedPoints
        ? t("loyalty.validation.pointsRequired", "Points are required.")
        : null;
    const nextNotesError =
      normalizedNotes.length < 3
        ? t("loyalty.validation.notesRequired", "Notes are required.")
        : null;

    setPointsError(nextPointsError);
    setNotesError(nextNotesError);

    if (nextPointsError || nextNotesError) {
      return;
    }

    onConfirm({
      points: normalizedPoints,
      notes: normalizedNotes,
      resetPending,
    });
  };

  return (
    <Modal title={title} isOpen={open} onClose={onClose}>
      <div className="space-y-4">
        <div
          className={`rounded-lg border p-3 text-sm ${
            destructive ? "border-rose-200 bg-rose-50 text-rose-700" : "border-slate-200 bg-slate-50 text-slate-600"
          }`}
        >
          {mode === "RESET"
            ? t(
                "loyalty.modal.reset.warning",
                "This action resets the customer loyalty balance and should be used carefully."
              )
            : `${t("loyalty.card.availablePoints", "Available points")}: ${formatPoints(
                availablePoints,
                language
              )}`}
        </div>

        {mode !== "RESET" ? (
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              {t("loyalty.field.points", "Points")}
            </label>
            <Input
              inputMode="decimal"
              value={points}
              onChange={(event) => {
                setPoints(event.target.value);
                if (pointsError) setPointsError(null);
              }}
              placeholder={mode === "MANUAL_ADD" ? "25.500" : "30.000"}
            />
            {pointsError ? <p className="text-xs text-rose-600">{pointsError}</p> : null}
          </div>
        ) : null}

        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">
            {t("loyalty.field.notes", "Notes")}
          </label>
          <textarea
            className="min-h-28 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            value={notes}
            onChange={(event) => {
              setNotes(event.target.value);
              if (notesError) setNotesError(null);
            }}
            placeholder={
              language === "ar" ? "أدخل مبرر الإجراء" : "Enter the operational reason for this action"
            }
          />
          {notesError ? <p className="text-xs text-rose-600">{notesError}</p> : null}
        </div>

        {mode === "RESET" ? (
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={resetPending}
              onChange={(event) => setResetPending(event.target.checked)}
            />
            {t("loyalty.field.resetPending", "Also reset pending points")}
          </label>
        ) : null}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            type="button"
            variant={destructive ? "danger" : "primary"}
            disabled={pending}
            onClick={handleConfirm}
          >
            {pending ? t("common.updating", "Updating...") : t("loyalty.modal.confirm", "Confirm action")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
