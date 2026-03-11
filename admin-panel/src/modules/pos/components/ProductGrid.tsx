"use client";

import { useState } from "react";
import Image from "next/image";
import type { PosProduct } from "@/modules/pos/store/pos.store";
import { formatEGP } from "@/lib/currency";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

type ProductGridProps = {
  products: PosProduct[];
  onAdd: (product: PosProduct) => void;
};

export default function ProductGrid({ products, onAdd }: ProductGridProps) {
  const { language } = useLocalization();
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => {
        const outOfStock = (product.stock ?? 0) <= 0;
        return (
        <button
          key={product.id}
          type="button"
          onClick={() => onAdd(product)}
          disabled={outOfStock}
          className={`rounded-xl border p-4 text-left shadow-sm transition ${
            outOfStock
              ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
              : "border-violet-100 bg-white hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md"
          }`}
        >
          <div className="relative mb-3 h-32 w-full overflow-hidden rounded-lg bg-slate-100">
            {product.imageUrl && !failedImages[product.id] ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                unoptimized
                sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                onError={() =>
                  setFailedImages((prev) => ({
                    ...prev,
                    [product.id]: true,
                  }))
                }
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                {language === "ar" ? "لا توجد صورة" : "No image"}
              </div>
            )}
          </div>
          {outOfStock ? (
            <p className="mb-1 inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
              {language === "ar" ? "نفد المخزون" : "Out of stock"}
            </p>
          ) : null}
          <p className="text-sm font-semibold text-slate-900">{product.name}</p>
          <p className="mt-1 text-xs text-slate-500">{product.category}</p>
          <p className="mt-3 text-base font-bold text-violet-700">{formatEGP(product.price)}</p>
        </button>
      );
      })}
    </div>
  );
}
