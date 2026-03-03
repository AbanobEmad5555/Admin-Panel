"use client";

import { useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import type { AdminReview } from "@/features/admin-reviews/api/adminReviews.types";

type ReviewMediaGalleryProps = {
  media: AdminReview["media"];
};

export default function ReviewMediaGallery({ media }: ReviewMediaGalleryProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const hasMedia = media.length > 0;
  const images = useMemo(() => media.filter((item) => item.type === "IMAGE"), [media]);
  const videos = useMemo(() => media.filter((item) => item.type === "VIDEO"), [media]);

  if (!hasMedia) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
        No media attached to this review.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {images.map((item) => (
          <a
            key={item.url}
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="group overflow-hidden rounded-md border border-slate-200 bg-white"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.url}
              alt="Review media"
              className="h-24 w-full object-cover transition group-hover:scale-[1.02]"
            />
          </a>
        ))}

        {videos.map((item) => (
          <button
            key={item.url}
            type="button"
            onClick={() => setVideoUrl(item.url)}
            className="flex h-24 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Play Video
          </button>
        ))}
      </div>

      <Modal
        title="Review Video"
        isOpen={Boolean(videoUrl)}
        onClose={() => setVideoUrl(null)}
      >
        {videoUrl ? (
          <video controls className="max-h-[60vh] w-full rounded-md" src={videoUrl} />
        ) : null}
      </Modal>
    </>
  );
}
