"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import AdminLayout from "@/components/layout/AdminLayout";
import Button from "@/components/ui/Button";
import GradientCard from "@/components/ui/GradientCard";
import Input from "@/components/ui/Input";
import PageHeader from "@/components/ui/PageHeader";
import api from "@/services/api";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

type FooterSettingsResponse = {
  websiteName?: string | null;
  websiteNameEn?: string | null;
  websiteNameAr?: string | null;
  copyrightText?: string | null;
  copyrightTextEn?: string | null;
  copyrightTextAr?: string | null;
};

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  message?: string;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (!error || typeof error !== "object") {
    return fallback;
  }

  const maybeAxios = error as { response?: { data?: { message?: string } } };
  return maybeAxios.response?.data?.message ?? fallback;
};

export default function FooterSettingsPage() {
  const { language } = useLocalization();
  const text =
    language === "ar"
      ? {
          title: "إعدادات التذييل",
          description: "حدّث اسم الموقع ونصوص حقوق النشر من صفحة مستقلة.",
          websiteNameEn: "اسم الموقع بالإنجليزية",
          websiteNameAr: "اسم الموقع بالعربية",
          copyrightEn: "نص حقوق النشر بالإنجليزية",
          copyrightAr: "نص حقوق النشر بالعربية",
          reset: "إعادة تعيين",
          save: "حفظ التغييرات",
          saving: "جارٍ الحفظ...",
          loadedError: "تعذر تحميل إعدادات التذييل.",
          saveError: "تعذر حفظ إعدادات التذييل.",
          saved: "تم تحديث إعدادات التذييل.",
        }
      : {
          title: "Footer Settings",
          description: "Manage website naming and copyright copy from a dedicated page.",
          websiteNameEn: "Website Name (English)",
          websiteNameAr: "Website Name (Arabic)",
          copyrightEn: "Copyright Text (English)",
          copyrightAr: "Copyright Text (Arabic)",
          reset: "Reset",
          save: "Save Changes",
          saving: "Saving...",
          loadedError: "Unable to load footer settings.",
          saveError: "Unable to save footer settings.",
          saved: "Footer settings updated.",
        };

  const [websiteNameEn, setWebsiteNameEn] = useState("");
  const [websiteNameAr, setWebsiteNameAr] = useState("");
  const [copyrightEn, setCopyrightEn] = useState("");
  const [copyrightAr, setCopyrightAr] = useState("");
  const [initialState, setInitialState] = useState<{
    websiteNameEn: string;
    websiteNameAr: string;
    copyrightEn: string;
    copyrightAr: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadFooterSettings = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await api.get<ApiResponse<FooterSettingsResponse>>("/footer-settings");
        const data = response.data?.data ?? {};
        const nextState = {
          websiteNameEn: data.websiteNameEn ?? data.websiteName ?? "",
          websiteNameAr: data.websiteNameAr ?? "",
          copyrightEn: data.copyrightTextEn ?? data.copyrightText ?? "",
          copyrightAr: data.copyrightTextAr ?? "",
        };

        setWebsiteNameEn(nextState.websiteNameEn);
        setWebsiteNameAr(nextState.websiteNameAr);
        setCopyrightEn(nextState.copyrightEn);
        setCopyrightAr(nextState.copyrightAr);
        setInitialState(nextState);
      } catch (loadError) {
        setError(getErrorMessage(loadError, text.loadedError));
      } finally {
        setIsLoading(false);
      }
    };

    void loadFooterSettings();
  }, [text.loadedError]);

  const handleReset = () => {
    if (!initialState) {
      return;
    }

    setWebsiteNameEn(initialState.websiteNameEn);
    setWebsiteNameAr(initialState.websiteNameAr);
    setCopyrightEn(initialState.copyrightEn);
    setCopyrightAr(initialState.copyrightAr);
    setError("");
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError("");

    try {
      const payload = {
        websiteName: websiteNameEn.trim(),
        websiteNameEn: websiteNameEn.trim(),
        websiteNameAr: websiteNameAr.trim() || undefined,
        copyrightText: copyrightEn.trim(),
        copyrightTextEn: copyrightEn.trim(),
        copyrightTextAr: copyrightAr.trim() || undefined,
      };

      await api.put("/admin/footer-settings", payload);
      setInitialState({
        websiteNameEn: payload.websiteNameEn,
        websiteNameAr: websiteNameAr.trim(),
        copyrightEn: payload.copyrightTextEn,
        copyrightAr: copyrightAr.trim(),
      });
      toast.success(text.saved);
    } catch (saveError) {
      const message = getErrorMessage(saveError, text.saveError);
      setError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout requiredPermissions={["homepage.view", "homepage.edit"]}>
      <section className="space-y-6">
        <PageHeader
          eyebrow="Website"
          title={text.title}
          description={text.description}
          actions={
            <>
              <Button variant="secondary" onClick={handleReset} disabled={!initialState || isSaving}>
                {text.reset}
              </Button>
              <Button onClick={handleSave} disabled={isLoading || isSaving}>
                {isSaving ? text.saving : text.save}
              </Button>
            </>
          }
        />

        <GradientCard padding="lg" glow>
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-12 animate-pulse rounded-2xl bg-white/8" />
              <div className="h-12 animate-pulse rounded-2xl bg-white/8" />
              <div className="h-24 animate-pulse rounded-2xl bg-white/8" />
              <div className="h-24 animate-pulse rounded-2xl bg-white/8" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-200">{text.websiteNameEn}</span>
                <Input value={websiteNameEn} onChange={(event) => setWebsiteNameEn(event.target.value)} />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-200">{text.websiteNameAr}</span>
                <Input
                  value={websiteNameAr}
                  onChange={(event) => setWebsiteNameAr(event.target.value)}
                  dir="rtl"
                  className="text-right"
                />
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-slate-200">{text.copyrightEn}</span>
                <textarea
                  value={copyrightEn}
                  onChange={(event) => setCopyrightEn(event.target.value)}
                  className="glass-input min-h-24 w-full rounded-2xl border border-white/10 bg-white/6 px-3 py-2.5 text-sm text-slate-50 outline-none focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-400/20"
                />
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-slate-200">{text.copyrightAr}</span>
                <textarea
                  value={copyrightAr}
                  onChange={(event) => setCopyrightAr(event.target.value)}
                  dir="rtl"
                  className="glass-input min-h-24 w-full rounded-2xl border border-white/10 bg-white/6 px-3 py-2.5 text-right text-sm text-slate-50 outline-none focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-400/20"
                />
              </label>
            </div>
          )}
        </GradientCard>

        {error ? (
          <GradientCard padding="md" className="border-rose-300/20 bg-rose-500/12 text-sm text-rose-100">
            {error}
          </GradientCard>
        ) : null}
      </section>
    </AdminLayout>
  );
}
