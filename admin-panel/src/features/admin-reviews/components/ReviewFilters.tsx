"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import type { AdminReviewsFilters, ReviewStatus } from "@/features/admin-reviews/api/adminReviews.types";

type ReviewFiltersProps = {
  value: AdminReviewsFilters;
  onApply: (next: AdminReviewsFilters) => void;
  onClear: (next: AdminReviewsFilters) => void;
};

const STATUS_OPTIONS: Array<{ label: string; value: ReviewStatus | "" }> = [
  { label: "All", value: "" },
  { label: "PENDING", value: "PENDING" },
  { label: "APPROVED", value: "APPROVED" },
  { label: "HIDDEN", value: "HIDDEN" },
];

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const toDraftFromValue = (value: AdminReviewsFilters): AdminReviewsFilters => ({
  page: value.page,
  limit: value.limit,
  reviewId: value.reviewId,
  onlyEdited: value.onlyEdited,
  status: value.status,
  productId: value.productId,
  userId: value.userId,
  startDate: value.startDate,
  endDate: value.endDate,
});

export default function ReviewFilters({ value, onApply, onClear }: ReviewFiltersProps) {
  const [draft, setDraft] = useState<AdminReviewsFilters>(() => toDraftFromValue(value));

  useEffect(() => {
    setDraft(toDraftFromValue(value));
  }, [value]);

  return (
    <section className="sticky top-16 z-10 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-8">
        <div>
          <label className="text-xs font-medium text-slate-600">Review ID</label>
          <input
            value={draft.reviewId ?? ""}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, reviewId: event.target.value || undefined }))
            }
            placeholder="Optional"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Status</label>
          <select
            value={draft.status ?? ""}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                status: (event.target.value || undefined) as ReviewStatus | undefined,
              }))
            }
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Product ID</label>
          <input
            value={draft.productId ?? ""}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, productId: event.target.value || undefined }))
            }
            placeholder="Optional"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">User ID</label>
          <input
            value={draft.userId ?? ""}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, userId: event.target.value || undefined }))
            }
            placeholder="Optional"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Start Date</label>
          <input
            type="date"
            value={draft.startDate ?? ""}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, startDate: event.target.value || undefined }))
            }
            onClick={(event) => {
              event.currentTarget.showPicker?.();
            }}
            onFocus={(event) => {
              event.currentTarget.showPicker?.();
            }}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">End Date</label>
          <input
            type="date"
            value={draft.endDate ?? ""}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, endDate: event.target.value || undefined }))
            }
            onClick={(event) => {
              event.currentTarget.showPicker?.();
            }}
            onFocus={(event) => {
              event.currentTarget.showPicker?.();
            }}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Edited Reviews</label>
          <label className="mt-1 inline-flex items-center gap-2 rounded border border-slate-300 px-3 py-2 text-sm text-slate-900">
            <input
              type="checkbox"
              checked={Boolean(draft.onlyEdited)}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, onlyEdited: event.target.checked }))
              }
              className="h-4 w-4 accent-slate-900"
            />
            Show only edited reviews
          </label>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-600">Page Size</label>
          <select
            value={draft.limit}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, limit: Number(event.target.value) }))
            }
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            const cleared: AdminReviewsFilters = {
              page: 1,
              limit: draft.limit || value.limit || 10,
              onlyEdited: false,
            };
            setDraft(cleared);
            onClear(cleared);
          }}
        >
          Clear
        </Button>
        <Button
          type="button"
          onClick={() =>
            onApply({
              ...draft,
              page: 1,
            })
          }
        >
          Filter
        </Button>
      </div>
    </section>
  );
}
