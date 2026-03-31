"use client";

import { useEffect, useState } from "react";
import { Globe, Instagram, MessageCircle, Twitter } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/layout/AdminLayout";
import Button from "@/components/ui/Button";
import GradientCard from "@/components/ui/GradientCard";
import Input from "@/components/ui/Input";
import PageHeader from "@/components/ui/PageHeader";
import { extractList } from "@/lib/extractList";
import { useLocalization } from "@/modules/localization/LocalizationProvider";
import api from "@/services/api";

type SocialLink = {
  platform: string;
  url: string | null;
  isActive: boolean;
};

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  message?: string;
};

const SOCIAL_PLATFORMS = [
  { key: "facebook", label: "Facebook", icon: Globe },
  { key: "instagram", label: "Instagram", icon: Instagram },
  { key: "x", label: "X", icon: Twitter },
  { key: "snapchat", label: "Snapchat", icon: MessageCircle },
] as const;

const getErrorMessage = (error: unknown, fallback: string) => {
  if (!error || typeof error !== "object") {
    return fallback;
  }

  const maybeAxios = error as { response?: { data?: { message?: string } } };
  return maybeAxios.response?.data?.message ?? fallback;
};

export default function SocialLinksPage() {
  const { language } = useLocalization();
  const text =
    language === "ar"
      ? {
          title: "روابط التواصل الاجتماعي",
          description: "تحكم في روابط وحالة الأيقونات الاجتماعية المعروضة في تذييل الموقع.",
          active: "نشط",
          save: "حفظ",
          saving: "جارٍ الحفظ...",
          loadError: "تعذر تحميل روابط التواصل الاجتماعي.",
          saveError: "تعذر حفظ الرابط.",
          saved: "تم تحديث الرابط بنجاح.",
          placeholder: "أدخل الرابط الكامل",
        }
      : {
          title: "Social Links",
          description: "Manage the social icons and URLs shown in the website footer.",
          active: "Active",
          save: "Save",
          saving: "Saving...",
          loadError: "Unable to load social links.",
          saveError: "Unable to save social link.",
          saved: "Social link updated.",
          placeholder: "Enter the full URL",
        };

  const [links, setLinks] = useState<SocialLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadSocialLinks = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await api.get<ApiResponse<SocialLink[]>>("/admin/social-links");
        const data = extractList<SocialLink>(response.data?.data ?? response.data);
        const normalized = SOCIAL_PLATFORMS.map((platform) => {
          const match = data.find((item) => item.platform?.toLowerCase() === platform.key);
          return {
            platform: platform.key,
            url: match?.url ?? "",
            isActive: Boolean(match?.isActive),
          };
        });

        setLinks(normalized);
      } catch (loadError) {
        setError(getErrorMessage(loadError, text.loadError));
        setLinks(
          SOCIAL_PLATFORMS.map((platform) => ({
            platform: platform.key,
            url: "",
            isActive: false,
          }))
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadSocialLinks();
  }, [text.loadError]);

  const updateLink = (
    platform: string,
    field: "url" | "isActive",
    value: string | boolean
  ) => {
    setLinks((current) =>
      current.map((link) => (link.platform === platform ? { ...link, [field]: value } : link))
    );
  };

  const saveLink = async (platform: string) => {
    const currentLink = links.find((link) => link.platform === platform);
    if (!currentLink) {
      return;
    }

    setSavingMap((current) => ({ ...current, [platform]: true }));
    setError("");

    try {
      await api.put(`/admin/social-links/${platform}`, {
        url: currentLink.url ?? "",
        isActive: Boolean(currentLink.isActive),
      });
      toast.success(text.saved);
    } catch (saveError) {
      const message = getErrorMessage(saveError, text.saveError);
      setError(message);
      toast.error(message);
    } finally {
      setSavingMap((current) => ({ ...current, [platform]: false }));
    }
  };

  return (
    <AdminLayout requiredPermissions={["homepage.view", "homepage.edit"]}>
      <section className="space-y-6">
        <PageHeader
          eyebrow="Website"
          title={text.title}
          description={text.description}
        />

        {isLoading ? (
          <GradientCard padding="lg" className="space-y-3">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-2xl bg-white/8" />
            ))}
          </GradientCard>
        ) : (
          <div className="grid gap-4">
            {SOCIAL_PLATFORMS.map((platform) => {
              const Icon = platform.icon;
              const link = links.find((item) => item.platform === platform.key);
              const isSaving = savingMap[platform.key] ?? false;

              return (
                <GradientCard key={platform.key} padding="md" interactive>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-500/12 text-cyan-100">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-50">{platform.label}</p>
                        <label className="mt-1 inline-flex items-center gap-2 text-xs text-slate-300">
                          <input
                            type="checkbox"
                            checked={Boolean(link?.isActive)}
                            onChange={(event) => updateLink(platform.key, "isActive", event.target.checked)}
                            className="h-4 w-4 accent-cyan-400"
                          />
                          {text.active}
                        </label>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col gap-3 lg:flex-row">
                      <Input
                        type="url"
                        value={link?.url ?? ""}
                        onChange={(event) => updateLink(platform.key, "url", event.target.value)}
                        placeholder={text.placeholder}
                        disabled={!link?.isActive}
                        className="flex-1 disabled:opacity-40"
                      />
                      <Button
                        variant="secondary"
                        onClick={() => void saveLink(platform.key)}
                        disabled={isSaving}
                      >
                        {isSaving ? text.saving : text.save}
                      </Button>
                    </div>
                  </div>
                </GradientCard>
              );
            })}
          </div>
        )}

        {error ? (
          <GradientCard padding="md" className="border-rose-300/20 bg-rose-500/12 text-sm text-rose-100">
            {error}
          </GradientCard>
        ) : null}
      </section>
    </AdminLayout>
  );
}
