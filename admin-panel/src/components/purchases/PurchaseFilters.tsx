import Input from "@/components/ui/Input";
import type { PurchaseStatus } from "@/components/purchases/types";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

export type PurchaseSortValue =
  | "price_asc"
  | "price_desc"
  | "arrival_asc"
  | "arrival_desc";

export type PurchaseFiltersValue = {
  search: string;
  supplier: string;
  status: PurchaseStatus | "ALL";
  arrivalDate: string;
  sort: PurchaseSortValue;
};

type PurchaseFiltersProps = {
  value: PurchaseFiltersValue;
  suppliers: string[];
  onChange: (next: PurchaseFiltersValue) => void;
  onApply: () => void;
  onClear: () => void;
  disabled?: boolean;
};

export default function PurchaseFilters({
  value,
  suppliers,
  onChange,
  onApply,
  onClear,
  disabled = false,
}: PurchaseFiltersProps) {
  const { language } = useLocalization();
  const text =
    language === "ar"
      ? {
          searchPlaceholder: "ابحث بالاسم أو رقم الشراء",
          allSuppliers: "كل الموردين",
          allStatuses: "كل الحالات",
          ordered: "تم الطلب",
          inTransit: "قيد النقل",
          delivered: "تم التسليم",
          cancelled: "ملغاة",
          priceAsc: "السعر تصاعديًا",
          priceDesc: "السعر تنازليًا",
          arrivalAsc: "تاريخ الوصول تصاعديًا",
          arrivalDesc: "تاريخ الوصول تنازليًا",
          clear: "مسح",
          apply: "تطبيق",
        }
      : {
          searchPlaceholder: "Search by name or purchase ID",
          allSuppliers: "All suppliers",
          allStatuses: "All statuses",
          ordered: "ORDERED",
          inTransit: "IN_TRANSIT",
          delivered: "DELIVERED",
          cancelled: "CANCELLED",
          priceAsc: "Price Ascending",
          priceDesc: "Price Descending",
          arrivalAsc: "Arrival Date Ascending",
          arrivalDesc: "Arrival Date Descending",
          clear: "Clear",
          apply: "Apply",
        };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Input
          placeholder={text.searchPlaceholder}
          value={value.search}
          onChange={(event) => onChange({ ...value, search: event.target.value })}
          disabled={disabled}
        />
        <select
          value={value.supplier}
          onChange={(event) => onChange({ ...value, supplier: event.target.value })}
          disabled={disabled}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
        >
          <option value="ALL">{text.allSuppliers}</option>
          {suppliers.map((supplier) => (
            <option key={supplier} value={supplier}>
              {supplier}
            </option>
          ))}
        </select>
        <select
          value={value.status}
          onChange={(event) =>
            onChange({ ...value, status: event.target.value as PurchaseStatus | "ALL" })
          }
          disabled={disabled}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
        >
          <option value="ALL">{text.allStatuses}</option>
          <option value="ORDERED">{text.ordered}</option>
          <option value="IN_TRANSIT">{text.inTransit}</option>
          <option value="DELIVERED">{text.delivered}</option>
          <option value="CANCELLED">{text.cancelled}</option>
        </select>
        <Input
          type="date"
          value={value.arrivalDate}
          onChange={(event) => onChange({ ...value, arrivalDate: event.target.value })}
          onClick={(event) => event.currentTarget.showPicker?.()}
          disabled={disabled}
          className="cursor-pointer"
        />
        <select
          value={value.sort}
          onChange={(event) => onChange({ ...value, sort: event.target.value as PurchaseSortValue })}
          disabled={disabled}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
        >
          <option value="price_asc">{text.priceAsc}</option>
          <option value="price_desc">{text.priceDesc}</option>
          <option value="arrival_asc">{text.arrivalAsc}</option>
          <option value="arrival_desc">{text.arrivalDesc}</option>
        </select>
      </div>
      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClear}
          disabled={disabled}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
        >
          {text.clear}
        </button>
        <button
          type="button"
          onClick={onApply}
          disabled={disabled}
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {text.apply}
        </button>
      </div>
    </div>
  );
}
