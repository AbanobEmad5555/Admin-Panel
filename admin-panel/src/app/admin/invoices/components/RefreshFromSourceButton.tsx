import { RefreshCw } from "lucide-react";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

type Props = {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export default function RefreshFromSourceButton({ onClick, disabled, loading }: Props) {
  const { language } = useLocalization();
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
      {language === "ar" ? "تحديث من المصدر" : "Refresh From Source"}
    </button>
  );
}

