type NotificationPreferenceToggleProps = {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
  badge?: string;
  onChange: (checked: boolean) => void;
};

export default function NotificationPreferenceToggle({
  id,
  label,
  description,
  checked,
  disabled = false,
  badge,
  onChange,
}: NotificationPreferenceToggleProps) {
  return (
    <label
      htmlFor={id}
      className={`flex items-start justify-between gap-4 rounded-xl border px-4 py-3 transition ${
        disabled ? "border-slate-200 bg-slate-50 opacity-70" : "border-slate-200 bg-white"
      }`}
    >
      <span className="min-w-0 space-y-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-slate-900">{label}</span>
          {badge ? (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {badge}
            </span>
          ) : null}
        </span>
        {description ? <span className="block text-sm text-slate-500">{description}</span> : null}
      </span>

      <span className="relative mt-0.5 inline-flex shrink-0 items-center">
        <input
          id={id}
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span
          aria-hidden="true"
          className={`flex h-6 w-11 items-center rounded-full transition ${
            checked ? "bg-slate-900" : "bg-slate-300"
          } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
        >
          <span
            className={`mx-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition ${
              checked ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </span>
      </span>
    </label>
  );
}
