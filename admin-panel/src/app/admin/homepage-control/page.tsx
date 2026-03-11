"use client";

import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import api from "@/services/api";
import Modal from "@/components/ui/Modal";
import { ADMIN_TOKEN_KEY } from "@/lib/auth";
import LocalizedDisplayText from "@/modules/shared/components/LocalizedDisplayText";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

type HomepagePayload = {
  heroImage?: string | null;
  heroTextPrimary?: string | null;
  heroTextSecondary?: string | null;
  heroTextPrimaryEn?: string | null;
  heroTextPrimaryAr?: string | null;
  heroTextSecondaryEn?: string | null;
  heroTextSecondaryAr?: string | null;
  showNewCollection?: boolean | null;
  logoUrl?: string | null;
};

type HeroStat = {
  id: number;
  value: string;
  text: string;
  textEn?: string | null;
  textAr?: string | null;
  order: number;
  isActive: boolean;
};

type WhyShopCard = {
  id: number;
  title: string;
  description: string;
  titleEn?: string | null;
  titleAr?: string | null;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  order: number;
  isActive: boolean;
};

type SocialLink = {
  platform: string;
  url: string | null;
  isActive: boolean;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

const SOCIAL_PLATFORMS = [
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "x", label: "X" },
  { key: "snapchat", label: "Snapchat" },
] as const;

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null) {
    const anyError = error as { response?: { data?: { message?: string } } };
    return anyError.response?.data?.message ?? fallback;
  }
  return fallback;
};

const adminFetch = async <T,>(
  path: string,
  options: RequestInit = {}
): Promise<T> => {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem(ADMIN_TOKEN_KEY)
      : null;
  const headers = new Headers(options.headers ?? {});
  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }
  const response = await fetch(path, {
    ...options,
    headers,
  });
  const data = (await response.json().catch(() => ({}))) as T;
  if (!response.ok) {
    throw { response: { data } };
  }
  return data;
};

export default function HomepageControlPage() {
  const { language } = useLocalization();
  const text =
    language === "ar"
      ? {
          genericError: "حدث خطأ ما.",
          valueAndTextRequired: "القيمة والنص مطلوبان.",
          invalidHeroId: "معرّف بيانات البطل غير صالح.",
          orderMustBeNumber: "يجب أن يكون الترتيب رقمًا.",
          noChangesToSave: "لا توجد تغييرات للحفظ.",
          titleAndDescriptionRequired: "العنوان والوصف مطلوبان.",
          invalidCardId: "معرّف البطاقة غير صالح.",
          selectLogoFile: "يرجى اختيار ملف شعار للرفع.",
          logoUpdated: "تم تحديث الشعار بنجاح.",
          footerUpdated: "تم تحديث إعدادات التذييل.",
          heroTextRequired: "نصا واجهة البطل مطلوبان.",
          homepageUpdated: "تم تحديث الصفحة الرئيسية بنجاح.",
          title: "التحكم في الصفحة الرئيسية",
          subtitle: "أدر محتوى قسم البطل المعروض على الموقع.",
          logoControl: "التحكم في الشعار",
          logoSubtitle: "حدّث الشعار المستخدم في المتجر بالكامل.",
          uploadLogo: "رفع الشعار",
          saveLogo: "حفظ الشعار",
          footerSettings: "إعدادات التذييل",
          footerSubtitle: "حدّث اسم الموقع ونص حقوق النشر.",
          websiteName: "اسم الموقع",
          copyrightText: "نص حقوق النشر",
          saveFooter: "حفظ التذييل",
          reset: "إعادة تعيين",
          heroSection: "التحكم في قسم البطل",
          noImageSelected: "لم يتم اختيار صورة",
          heroBannerImage: "صورة بانر البطل",
          newCollectionIcon: "أيقونة المجموعة الجديدة",
          heroText1: "نص البطل 1 (العنوان الرئيسي)",
          heroText2: "نص البطل 2 (العنوان الفرعي)",
          saveChanges: "حفظ التغييرات",
          saving: "جارٍ الحفظ...",
          heroDataControl: "التحكم في بيانات البطل",
          heroDataSubtitle: "أدر إحصائيات البطل المعروضة في الصفحة الرئيسية.",
          addHeroData: "إضافة بيانات البطل",
          noHeroData: "لا توجد بيانات بطل.",
          value: "القيمة",
          labelText: "النص",
          order: "الترتيب",
          active: "نشط",
          inactive: "غير نشط",
          actions: "الإجراءات",
          edit: "تعديل",
          delete: "حذف",
          socialMediaLinks: "روابط التواصل الاجتماعي",
          socialSubtitle: "تحكم في الأيقونات الاجتماعية المعروضة في تذييل الموقع.",
          save: "حفظ",
          whyShop: "لماذا تتسوق معنا",
          whyShopSubtitle: "أدر البطاقات المعروضة في قسم لماذا تتسوق معنا.",
          addCard: "إضافة بطاقة",
          noCards: "لا توجد بطاقات.",
          description: "الوصف",
          status: "الحالة",
          editHeroData: "تعديل بيانات البطل",
          addHeroDataTitle: "إضافة بيانات البطل",
          enterValue: "أدخل القيمة",
          enterText: "أدخل النص",
          cancel: "إلغاء",
          editCard: "تعديل البطاقة",
          addCardTitle: "إضافة بطاقة",
          enterTitle: "أدخل العنوان",
          deleteCard: "حذف البطاقة",
          deleteCardBody: "هل تريد حذف هذه البطاقة؟",
          deleting: "جارٍ الحذف...",
          deleteHeroData: "حذف بيانات البطل",
          deleteHeroDataBody: "هل تريد حذف عنصر بيانات البطل هذا؟",
          logoPreviewAlt: "معاينة الشعار",
          heroPreviewAlt: "معاينة صورة البطل",
        }
      : {
          genericError: "Something went wrong.",
          valueAndTextRequired: "Value and text are required.",
          invalidHeroId: "Invalid hero data id.",
          orderMustBeNumber: "Order must be a number.",
          noChangesToSave: "No changes to save.",
          titleAndDescriptionRequired: "Title and description are required.",
          invalidCardId: "Invalid card id.",
          selectLogoFile: "Please select a logo file to upload.",
          logoUpdated: "Logo updated successfully.",
          footerUpdated: "Footer settings updated.",
          heroTextRequired: "Hero text fields are required.",
          homepageUpdated: "Homepage updated successfully.",
          title: "HomePage Control",
          subtitle: "Manage the hero section content shown on the website.",
          logoControl: "Logo Control",
          logoSubtitle: "Update the logo used across the storefront.",
          uploadLogo: "Upload Logo",
          saveLogo: "Save Logo",
          footerSettings: "Footer Settings",
          footerSubtitle: "Update website name and copyright text.",
          websiteName: "Website Name",
          copyrightText: "Copyright Text",
          saveFooter: "Save Footer",
          reset: "Reset",
          heroSection: "Hero Section Control",
          noImageSelected: "No image selected",
          heroBannerImage: "Hero Banner Image",
          newCollectionIcon: "New Collection Icon",
          heroText1: "Hero Text 1 (Main Header)",
          heroText2: "Hero Text 2 (Sub Header)",
          saveChanges: "Save Changes",
          saving: "Saving...",
          heroDataControl: "Hero Data Control",
          heroDataSubtitle: "Manage hero statistics displayed on the homepage.",
          addHeroData: "Add Hero Data",
          noHeroData: "No hero data items found.",
          value: "Value",
          labelText: "Text",
          order: "Order",
          active: "Active",
          inactive: "Inactive",
          actions: "Actions",
          edit: "Edit",
          delete: "Delete",
          socialMediaLinks: "Social Media Links",
          socialSubtitle: "Control the social icons shown in the website footer.",
          save: "Save",
          whyShop: "Why Shop With Us",
          whyShopSubtitle: "Manage the cards shown in the “Why Shop With Us” section.",
          addCard: "Add Card",
          noCards: "No cards found.",
          description: "Description",
          status: "Status",
          editHeroData: "Edit Hero Data",
          addHeroDataTitle: "Add Hero Data",
          enterValue: "Enter value",
          enterText: "Enter text",
          cancel: "Cancel",
          editCard: "Edit Card",
          addCardTitle: "Add Card",
          enterTitle: "Enter title",
          deleteCard: "Delete Card",
          deleteCardBody: "Are you sure you want to delete this card?",
          deleting: "Deleting...",
          deleteHeroData: "Delete Hero Data",
          deleteHeroDataBody: "Are you sure you want to delete this hero data item?",
          logoPreviewAlt: "Logo preview",
          heroPreviewAlt: "Hero preview",
        };
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [heroImage, setHeroImage] = useState<string>("");
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [heroTextPrimaryEn, setHeroTextPrimaryEn] = useState("");
  const [heroTextPrimaryAr, setHeroTextPrimaryAr] = useState("");
  const [heroTextSecondaryEn, setHeroTextSecondaryEn] = useState("");
  const [heroTextSecondaryAr, setHeroTextSecondaryAr] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState("");
  const [logoLoading, setLogoLoading] = useState(true);
  const [logoError, setLogoError] = useState("");
  const [logoSuccess, setLogoSuccess] = useState("");
  const [logoImageFailed, setLogoImageFailed] = useState(false);
  const [isLogoSaving, setIsLogoSaving] = useState(false);
  const [footerWebsiteNameEn, setFooterWebsiteNameEn] = useState("");
  const [footerWebsiteNameAr, setFooterWebsiteNameAr] = useState("");
  const [footerCopyrightEn, setFooterCopyrightEn] = useState("");
  const [footerCopyrightAr, setFooterCopyrightAr] = useState("");
  const [footerInitial, setFooterInitial] = useState<{
    websiteNameEn: string;
    websiteNameAr: string;
    copyrightTextEn: string;
    copyrightTextAr: string;
  } | null>(null);
  const [footerLoading, setFooterLoading] = useState(true);
  const [footerError, setFooterError] = useState("");
  const [footerSuccess, setFooterSuccess] = useState("");
  const [isFooterSaving, setIsFooterSaving] = useState(false);

  const [initialState, setInitialState] = useState<HomepagePayload | null>(null);
  const [heroStats, setHeroStats] = useState<HeroStat[]>([]);
  const [heroStatsLoading, setHeroStatsLoading] = useState(true);
  const [heroStatsError, setHeroStatsError] = useState("");
  const [isHeroStatModalOpen, setIsHeroStatModalOpen] = useState(false);
  const [isDeleteHeroStatOpen, setIsDeleteHeroStatOpen] = useState(false);
  const [editingHeroStat, setEditingHeroStat] = useState<HeroStat | null>(null);
  const [heroStatValue, setHeroStatValue] = useState("");
  const [heroStatTextEn, setHeroStatTextEn] = useState("");
  const [heroStatTextAr, setHeroStatTextAr] = useState("");
  const [heroStatOrder, setHeroStatOrder] = useState("");
  const [heroStatActive, setHeroStatActive] = useState(true);
  const [whyShopCards, setWhyShopCards] = useState<WhyShopCard[]>([]);
  const [whyShopLoading, setWhyShopLoading] = useState(true);
  const [whyShopError, setWhyShopError] = useState("");
  const [isWhyShopModalOpen, setIsWhyShopModalOpen] = useState(false);
  const [isWhyShopDeleteOpen, setIsWhyShopDeleteOpen] = useState(false);
  const [editingWhyShop, setEditingWhyShop] = useState<WhyShopCard | null>(null);
  const [whyShopTitleEn, setWhyShopTitleEn] = useState("");
  const [whyShopTitleAr, setWhyShopTitleAr] = useState("");
  const [whyShopDescriptionEn, setWhyShopDescriptionEn] = useState("");
  const [whyShopDescriptionAr, setWhyShopDescriptionAr] = useState("");
  const [whyShopOrder, setWhyShopOrder] = useState("");
  const [whyShopActive, setWhyShopActive] = useState(true);
  const [whyShopSaving, setWhyShopSaving] = useState<Record<number, boolean>>({});
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [socialLoading, setSocialLoading] = useState(true);
  const [socialError, setSocialError] = useState("");
  const [socialSaving, setSocialSaving] = useState<Record<string, boolean>>({});

  const previewUrl = useMemo(() => {
    if (heroImageFile) {
      return URL.createObjectURL(heroImageFile);
    }
    return heroImage;
  }, [heroImage, heroImageFile]);

  useEffect(() => {
    const loadHomepage = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await adminFetch<ApiResponse<HomepagePayload>>(
          "/api/homepage"
        );
        const payload = response.data ?? {};
        setHeroImage(payload.heroImage ?? "");
        setHeroTextPrimaryEn(payload.heroTextPrimaryEn ?? payload.heroTextPrimary ?? "");
        setHeroTextPrimaryAr(payload.heroTextPrimaryAr ?? "");
        setHeroTextSecondaryEn(payload.heroTextSecondaryEn ?? payload.heroTextSecondary ?? "");
        setHeroTextSecondaryAr(payload.heroTextSecondaryAr ?? "");
        setShowNewCollection(Boolean(payload.showNewCollection));
        setInitialState(payload);
      } catch (err) {
        setError(getErrorMessage(err, text.genericError));
      } finally {
        setIsLoading(false);
      }
    };

    loadHomepage();
  }, [text.genericError]);

  useEffect(() => {
    const loadLogo = async () => {
      setLogoLoading(true);
      setLogoError("");
      try {
        const response = await api.get<ApiResponse<{ logoUrl?: string | null }>>(
          "/homepage-control"
        );
        const nextLogo = response.data?.data?.logoUrl ?? "";
        setLogoUrl(nextLogo);
        setLogoFile(null);
        setLogoPreviewUrl("");
        setLogoImageFailed(false);
      } catch (err) {
        setLogoError(getErrorMessage(err, text.genericError));
      } finally {
        setLogoLoading(false);
      }
    };

    loadLogo();
  }, [text.genericError]);

  useEffect(() => {
    const loadFooterSettings = async () => {
      setFooterLoading(true);
      setFooterError("");
      try {
        const response = await api.get<
          ApiResponse<{
            websiteName?: string | null;
            websiteNameEn?: string | null;
            websiteNameAr?: string | null;
            copyrightText?: string | null;
            copyrightTextEn?: string | null;
            copyrightTextAr?: string | null;
          }>
        >("/footer-settings");
        const data = response.data?.data ?? {};
        const websiteNameEn = data.websiteNameEn ?? data.websiteName ?? "";
        const websiteNameAr = data.websiteNameAr ?? "";
        const copyrightTextEn = data.copyrightTextEn ?? data.copyrightText ?? "";
        const copyrightTextAr = data.copyrightTextAr ?? "";
        setFooterWebsiteNameEn(websiteNameEn);
        setFooterWebsiteNameAr(websiteNameAr);
        setFooterCopyrightEn(copyrightTextEn);
        setFooterCopyrightAr(copyrightTextAr);
        setFooterInitial({ websiteNameEn, websiteNameAr, copyrightTextEn, copyrightTextAr });
      } catch (err) {
        setFooterError(getErrorMessage(err, text.genericError));
      } finally {
        setFooterLoading(false);
      }
    };

    loadFooterSettings();
  }, [text.genericError]);

  useEffect(() => {
    const loadHeroStats = async () => {
      setHeroStatsLoading(true);
      setHeroStatsError("");
      try {
        const response = await adminFetch<ApiResponse<HeroStat[]>>(
          "/api/admin/homepage/hero-stats"
        );
        const normalized = (response.data ?? [])
          .map((stat) => ({ ...stat, id: Number(stat.id) }))
          .filter((stat) => Number.isFinite(stat.id));
        setHeroStats(normalized);
      } catch (err) {
        setHeroStatsError(getErrorMessage(err, text.genericError));
      } finally {
        setHeroStatsLoading(false);
      }
    };

    loadHeroStats();
  }, [text.genericError]);

  useEffect(() => {
    const loadWhyShop = async () => {
      setWhyShopLoading(true);
      setWhyShopError("");
      try {
        const response = await adminFetch<ApiResponse<WhyShopCard[]>>(
          "/api/admin/homepage/why-shop"
        );
        const normalized = (response.data ?? [])
          .map((card) => ({ ...card, id: Number(card.id) }))
          .filter((card) => Number.isFinite(card.id));
        setWhyShopCards(normalized);
      } catch (err) {
        setWhyShopError(getErrorMessage(err, text.genericError));
      } finally {
        setWhyShopLoading(false);
      }
    };

    loadWhyShop();
  }, [text.genericError]);

  useEffect(() => {
    const loadSocialLinks = async () => {
      setSocialLoading(true);
      setSocialError("");
      try {
        const response = await api.get<ApiResponse<SocialLink[]>>(
          "/admin/social-links"
        );
        const data = response.data?.data ?? [];
        const normalized = SOCIAL_PLATFORMS.map((platform) => {
          const match = data.find(
            (item) => item.platform?.toLowerCase() === platform.key
          );
          return {
            platform: platform.key,
            url: match?.url ?? "",
            isActive: Boolean(match?.isActive),
          };
        });
        setSocialLinks(normalized);
      } catch (err) {
        setSocialError(getErrorMessage(err, text.genericError));
        setSocialLinks(
          SOCIAL_PLATFORMS.map((platform) => ({
            platform: platform.key,
            url: "",
            isActive: false,
          }))
        );
      } finally {
        setSocialLoading(false);
      }
    };

    loadSocialLinks();
  }, [text.genericError]);

  const resetHeroStatForm = () => {
    setHeroStatValue("");
    setHeroStatTextEn("");
    setHeroStatTextAr("");
    setHeroStatOrder("");
    setHeroStatActive(true);
    setEditingHeroStat(null);
  };

  const resetWhyShopForm = () => {
    setWhyShopTitleEn("");
    setWhyShopTitleAr("");
    setWhyShopDescriptionEn("");
    setWhyShopDescriptionAr("");
    setWhyShopOrder("");
    setWhyShopActive(true);
    setEditingWhyShop(null);
  };

  const openAddHeroStat = () => {
    resetHeroStatForm();
    setIsHeroStatModalOpen(true);
  };

  const openEditHeroStat = (stat: HeroStat) => {
    setEditingHeroStat(stat);
    setHeroStatValue(stat.value);
    setHeroStatTextEn(stat.textEn ?? stat.text);
    setHeroStatTextAr(stat.textAr ?? "");
    setHeroStatOrder(String(stat.order));
    setHeroStatActive(stat.isActive);
    setIsHeroStatModalOpen(true);
  };

  const openDeleteHeroStat = (stat: HeroStat) => {
    setEditingHeroStat(stat);
    setIsDeleteHeroStatOpen(true);
  };

  const openAddWhyShop = () => {
    resetWhyShopForm();
    setIsWhyShopModalOpen(true);
  };

  const openEditWhyShop = (card: WhyShopCard) => {
    setEditingWhyShop(card);
    setWhyShopTitleEn(card.titleEn ?? card.title);
    setWhyShopTitleAr(card.titleAr ?? "");
    setWhyShopDescriptionEn(card.descriptionEn ?? card.description);
    setWhyShopDescriptionAr(card.descriptionAr ?? "");
    setWhyShopOrder(String(card.order));
    setWhyShopActive(card.isActive);
    setIsWhyShopModalOpen(true);
  };

  const openDeleteWhyShop = (card: WhyShopCard) => {
    setEditingWhyShop(card);
    setIsWhyShopDeleteOpen(true);
  };

  const saveHeroStat = async () => {
    setIsSubmitting(true);
    setHeroStatsError("");
    try {
      if (!heroStatValue.trim() || !heroStatTextEn.trim()) {
        setHeroStatsError(text.valueAndTextRequired);
        return;
      }
      const payload: Partial<HeroStat> & {
        value?: string;
        text?: string;
        order?: number;
        isActive?: boolean;
      } = {};

      if (editingHeroStat) {
        const editId = Number(editingHeroStat.id);
        if (!Number.isFinite(editId) || editId <= 0) {
          setHeroStatsError(text.invalidHeroId);
          return;
        }
        if (heroStatValue.trim() !== editingHeroStat.value) {
          payload.value = heroStatValue.trim();
        }
        if (heroStatTextEn.trim() !== (editingHeroStat.textEn ?? editingHeroStat.text)) {
          payload.text = heroStatTextEn.trim();
          payload.textEn = heroStatTextEn.trim();
        }
        if (heroStatTextAr.trim() !== (editingHeroStat.textAr ?? "")) {
          payload.textAr = heroStatTextAr.trim() || null;
        }
        if (
          heroStatOrder.trim() !== "" &&
          Number(heroStatOrder) !== editingHeroStat.order
        ) {
          const orderValue = Number(heroStatOrder);
          if (Number.isNaN(orderValue)) {
            setHeroStatsError(text.orderMustBeNumber);
            return;
          }
          payload.order = orderValue;
        }
        if (heroStatActive !== editingHeroStat.isActive) {
          payload.isActive = heroStatActive;
        }
        if (Object.keys(payload).length === 0) {
          setHeroStatsError(text.noChangesToSave);
          return;
        }
        await api.put(`/admin/homepage/hero-stats/${editId}`, payload);
      } else {
        payload.value = heroStatValue.trim();
        payload.text = heroStatTextEn.trim();
        payload.textEn = heroStatTextEn.trim();
        payload.textAr = heroStatTextAr.trim() || null;
        payload.isActive = heroStatActive;
        if (heroStatOrder.trim() !== "") {
          const orderValue = Number(heroStatOrder);
          if (Number.isNaN(orderValue)) {
            setHeroStatsError(text.orderMustBeNumber);
            return;
          }
          payload.order = orderValue;
        }
        await adminFetch("/api/admin/homepage/hero-stats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      setIsHeroStatModalOpen(false);
      resetHeroStatForm();
      const response = await adminFetch<ApiResponse<HeroStat[]>>(
        "/api/admin/homepage/hero-stats"
      );
      const normalized = (response.data ?? [])
        .map((stat) => ({ ...stat, id: Number(stat.id) }))
        .filter((stat) => Number.isFinite(stat.id));
      setHeroStats(normalized);
    } catch (err) {
      setHeroStatsError(getErrorMessage(err, text.genericError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteHeroStat = async () => {
    if (!editingHeroStat) {
      return;
    }
    setIsSubmitting(true);
    setHeroStatsError("");
    try {
      const deleteId = Number(editingHeroStat.id);
      if (!Number.isFinite(deleteId) || deleteId <= 0) {
        setHeroStatsError(text.invalidHeroId);
        return;
      }
      await api.delete(`/admin/homepage/hero-stats/${deleteId}`);
      setIsDeleteHeroStatOpen(false);
      setEditingHeroStat(null);
      const response = await adminFetch<ApiResponse<HeroStat[]>>(
        "/api/admin/homepage/hero-stats"
      );
      const normalized = (response.data ?? [])
        .map((stat) => ({ ...stat, id: Number(stat.id) }))
        .filter((stat) => Number.isFinite(stat.id));
      setHeroStats(normalized);
    } catch (err) {
      setHeroStatsError(getErrorMessage(err, text.genericError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveWhyShop = async () => {
    setIsSubmitting(true);
    setWhyShopError("");
    try {
      if (!whyShopTitleEn.trim() || !whyShopDescriptionEn.trim()) {
        setWhyShopError(text.titleAndDescriptionRequired);
        return;
      }
      const payload: Partial<WhyShopCard> & {
        title?: string;
        description?: string;
        order?: number;
        isActive?: boolean;
      } = {};

      if (editingWhyShop) {
        const editId = Number(editingWhyShop.id);
        if (!Number.isFinite(editId) || editId <= 0) {
          setWhyShopError(text.invalidCardId);
          return;
        }
        if (whyShopTitleEn.trim() !== (editingWhyShop.titleEn ?? editingWhyShop.title)) {
          payload.title = whyShopTitleEn.trim();
          payload.titleEn = whyShopTitleEn.trim();
        }
        if (whyShopTitleAr.trim() !== (editingWhyShop.titleAr ?? "")) {
          payload.titleAr = whyShopTitleAr.trim() || null;
        }
        if (whyShopDescriptionEn.trim() !== (editingWhyShop.descriptionEn ?? editingWhyShop.description)) {
          payload.description = whyShopDescriptionEn.trim();
          payload.descriptionEn = whyShopDescriptionEn.trim();
        }
        if (whyShopDescriptionAr.trim() !== (editingWhyShop.descriptionAr ?? "")) {
          payload.descriptionAr = whyShopDescriptionAr.trim() || null;
        }
        if (
          whyShopOrder.trim() !== "" &&
          Number(whyShopOrder) !== editingWhyShop.order
        ) {
          const orderValue = Number(whyShopOrder);
          if (Number.isNaN(orderValue)) {
            setWhyShopError(text.orderMustBeNumber);
            return;
          }
          payload.order = orderValue;
        }
        if (whyShopActive !== editingWhyShop.isActive) {
          payload.isActive = whyShopActive;
        }
        if (Object.keys(payload).length === 0) {
          setWhyShopError(text.noChangesToSave);
          return;
        }
        await api.put(`/admin/homepage/why-shop/${editId}`, payload);
      } else {
        payload.title = whyShopTitleEn.trim();
        payload.titleEn = whyShopTitleEn.trim();
        payload.titleAr = whyShopTitleAr.trim() || null;
        payload.description = whyShopDescriptionEn.trim();
        payload.descriptionEn = whyShopDescriptionEn.trim();
        payload.descriptionAr = whyShopDescriptionAr.trim() || null;
        payload.isActive = whyShopActive;
        if (whyShopOrder.trim() !== "") {
          const orderValue = Number(whyShopOrder);
          if (Number.isNaN(orderValue)) {
            setWhyShopError(text.orderMustBeNumber);
            return;
          }
          payload.order = orderValue;
        }
        await adminFetch("/api/admin/homepage/why-shop", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      setIsWhyShopModalOpen(false);
      resetWhyShopForm();
      const response = await adminFetch<ApiResponse<WhyShopCard[]>>(
        "/api/admin/homepage/why-shop"
      );
      const normalized = (response.data ?? [])
        .map((card) => ({ ...card, id: Number(card.id) }))
        .filter((card) => Number.isFinite(card.id));
      setWhyShopCards(normalized);
    } catch (err) {
      setWhyShopError(getErrorMessage(err, text.genericError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteWhyShop = async () => {
    if (!editingWhyShop) {
      return;
    }
    setIsSubmitting(true);
    setWhyShopError("");
    try {
      const deleteId = Number(editingWhyShop.id);
      if (!Number.isFinite(deleteId) || deleteId <= 0) {
        setWhyShopError(text.invalidCardId);
        return;
      }
      await api.delete(`/admin/homepage/why-shop/${deleteId}`);
      setIsWhyShopDeleteOpen(false);
      setEditingWhyShop(null);
      const response = await adminFetch<ApiResponse<WhyShopCard[]>>(
        "/api/admin/homepage/why-shop"
      );
      const normalized = (response.data ?? [])
        .map((card) => ({ ...card, id: Number(card.id) }))
        .filter((card) => Number.isFinite(card.id));
      setWhyShopCards(normalized);
    } catch (err) {
      setWhyShopError(getErrorMessage(err, text.genericError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateWhyShopOrder = async (card: WhyShopCard, value: string) => {
    const orderValue = Number(value);
    if (Number.isNaN(orderValue)) {
      return;
    }
    const cardId = Number(card.id);
    if (!Number.isFinite(cardId) || cardId <= 0) {
      setWhyShopError(text.invalidCardId);
      return;
    }
    setWhyShopSaving((prev) => ({ ...prev, [card.id]: true }));
    try {
      await adminFetch(`/api/admin/homepage/why-shop/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cardId, order: orderValue }),
      });
      setWhyShopCards((prev) =>
        prev.map((item) =>
          item.id === card.id ? { ...item, order: orderValue } : item
        )
      );
    } catch (err) {
      setWhyShopError(getErrorMessage(err, text.genericError));
    } finally {
      setWhyShopSaving((prev) => ({ ...prev, [card.id]: false }));
    }
  };

  const updateSocialLink = (
    platform: string,
    field: "url" | "isActive",
    value: string | boolean
  ) => {
    setSocialLinks((prev) =>
      prev.map((link) =>
        link.platform === platform ? { ...link, [field]: value } : link
      )
    );
  };

  const saveSocialLink = async (platform: string) => {
    const link = socialLinks.find((item) => item.platform === platform);
    if (!link) {
      return;
    }
    const normalizedPlatform = platform.trim().toLowerCase();
    setSocialSaving((prev) => ({ ...prev, [platform]: true }));
    setSocialError("");
    try {
      await api.put(`/admin/social-links/${normalizedPlatform}`, {
        url: link.url ?? "",
        isActive: Boolean(link.isActive),
      });
    } catch (err) {
      setSocialError(getErrorMessage(err, text.genericError));
    } finally {
      setSocialSaving((prev) => ({ ...prev, [platform]: false }));
    }
  };

  const renderSocialIcon = (platform: string) => {
    switch (platform) {
      case "facebook":
        return (
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
            <path
              fill="currentColor"
              d="M13.5 9H16l-.5 3h-2v9h-3v-9H8V9h2.5V7.5C10.5 5.6 11.4 4 14 4h2v3h-2c-.7 0-1 .3-1 1V9z"
            />
          </svg>
        );
      case "instagram":
        return (
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
            <path
              fill="currentColor"
              d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm5 5.3a3.7 3.7 0 1 0 0 7.4 3.7 3.7 0 0 0 0-7.4zm6-1.8a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM12 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"
            />
          </svg>
        );
      case "snapchat":
        return (
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
            <path
              fill="currentColor"
              d="M12 3c2.4 0 4.4 1.9 4.4 4.2v4.4c0 .5.4.9.9 1.1l1.7.6a1 1 0 0 1 0 1.9l-1.7.6c-.6.2-1.1.7-1.3 1.3-.4 1.2-1.6 2-3 2h-1.9c-1.4 0-2.6-.8-3-2-.2-.6-.7-1.1-1.3-1.3l-1.7-.6a1 1 0 0 1 0-1.9l1.7-.6c.5-.2.9-.6.9-1.1V7.2C7.6 4.9 9.6 3 12 3z"
            />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
            <path
              fill="currentColor"
              d="M3 4l7.5 8.8L3 20h3.3l5.2-5.9L16.7 20H21l-7.9-9.2L21 4h-3.3l-5 5.7L7.3 4H3z"
            />
          </svg>
        );
    }
  };

  const handleReset = () => {
    if (!initialState) {
      return;
    }
    setHeroImage(initialState.heroImage ?? "");
    setHeroTextPrimaryEn(initialState.heroTextPrimaryEn ?? initialState.heroTextPrimary ?? "");
    setHeroTextPrimaryAr(initialState.heroTextPrimaryAr ?? "");
    setHeroTextSecondaryEn(initialState.heroTextSecondaryEn ?? initialState.heroTextSecondary ?? "");
    setHeroTextSecondaryAr(initialState.heroTextSecondaryAr ?? "");
    setShowNewCollection(Boolean(initialState.showNewCollection));
    setHeroImageFile(null);
    setError("");
    setSuccess("");
  };

  const handleLogoSave = async () => {
    if (!logoFile) {
      setLogoError(text.selectLogoFile);
      setLogoSuccess("");
      return;
    }

    setIsLogoSaving(true);
    setLogoError("");
    setLogoSuccess("");
    try {
      const formData = new FormData();
      formData.append("logo", logoFile);
      const response = await api.put<ApiResponse<{ logoUrl?: string | null }>>(
        "/admin/homepage-control/logo",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      const updatedLogo = response.data?.data?.logoUrl ?? logoUrl;
      setLogoUrl(updatedLogo);
      setLogoFile(null);
      setLogoPreviewUrl("");
      setLogoImageFailed(false);
      setLogoSuccess(text.logoUpdated);
    } catch (err) {
      setLogoError(getErrorMessage(err, text.genericError));
    } finally {
      setIsLogoSaving(false);
    }
  };

  const handleFooterSave = async () => {
    setIsFooterSaving(true);
    setFooterError("");
    setFooterSuccess("");
    try {
      await api.put("/admin/footer-settings", {
        websiteName: footerWebsiteNameEn.trim(),
        websiteNameEn: footerWebsiteNameEn.trim(),
        websiteNameAr: footerWebsiteNameAr.trim() || undefined,
        copyrightText: footerCopyrightEn.trim(),
        copyrightTextEn: footerCopyrightEn.trim(),
        copyrightTextAr: footerCopyrightAr.trim() || undefined,
      });
      setFooterInitial({
        websiteNameEn: footerWebsiteNameEn.trim(),
        websiteNameAr: footerWebsiteNameAr.trim(),
        copyrightTextEn: footerCopyrightEn.trim(),
        copyrightTextAr: footerCopyrightAr.trim(),
      });
      setFooterSuccess(text.footerUpdated);
    } catch (err) {
      setFooterError(getErrorMessage(err, text.genericError));
    } finally {
      setIsFooterSaving(false);
    }
  };

  useEffect(() => {
    if (!logoFile) {
      if (logoPreviewUrl) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
      setLogoPreviewUrl("");
      return;
    }
    const nextPreview = URL.createObjectURL(logoFile);
    setLogoPreviewUrl(nextPreview);
    return () => {
      URL.revokeObjectURL(nextPreview);
    };
  }, [logoFile, logoPreviewUrl]);

  const handleSave = async () => {
    setIsSubmitting(true);
    setError("");
    setSuccess("");
    try {
      if (!heroTextPrimaryEn.trim() || !heroTextSecondaryEn.trim()) {
        setError(text.heroTextRequired);
        return;
      }

      const formData = new FormData();
      if (heroImageFile) {
        formData.append("heroImage", heroImageFile);
      }

      if ((initialState?.heroTextPrimaryEn ?? initialState?.heroTextPrimary ?? "") !== heroTextPrimaryEn.trim()) {
        formData.append("heroTextPrimary", heroTextPrimaryEn.trim());
        formData.append("heroTextPrimaryEn", heroTextPrimaryEn.trim());
      }
      if ((initialState?.heroTextPrimaryAr ?? "") !== heroTextPrimaryAr.trim()) {
        formData.append("heroTextPrimaryAr", heroTextPrimaryAr.trim());
      }
      if ((initialState?.heroTextSecondaryEn ?? initialState?.heroTextSecondary ?? "") !== heroTextSecondaryEn.trim()) {
        formData.append("heroTextSecondary", heroTextSecondaryEn.trim());
        formData.append("heroTextSecondaryEn", heroTextSecondaryEn.trim());
      }
      if ((initialState?.heroTextSecondaryAr ?? "") !== heroTextSecondaryAr.trim()) {
        formData.append("heroTextSecondaryAr", heroTextSecondaryAr.trim());
      }
      if (Boolean(initialState?.showNewCollection) !== showNewCollection) {
        formData.append("showNewCollection", String(showNewCollection));
      }

      if (!heroImageFile && formData.entries().next().done) {
        setError(text.noChangesToSave);
        return;
      }

      await api.put("/admin/homepage", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess(text.homepageUpdated);
      setHeroImageFile(null);
      setInitialState({
        heroImage,
        heroTextPrimary: heroTextPrimaryEn.trim(),
        heroTextPrimaryEn: heroTextPrimaryEn.trim(),
        heroTextPrimaryAr: heroTextPrimaryAr.trim(),
        heroTextSecondary: heroTextSecondaryEn.trim(),
        heroTextSecondaryEn: heroTextSecondaryEn.trim(),
        heroTextSecondaryAr: heroTextSecondaryAr.trim(),
        showNewCollection,
      });
    } catch (err) {
      setError(getErrorMessage(err, text.genericError));
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    return () => {
      if (heroImageFile && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [heroImageFile, previewUrl]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {text.title}
          </h1>
          <p className="text-sm text-slate-500">
            {text.subtitle}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {text.logoControl}
              </h2>
              <p className="text-sm text-slate-500">
                {text.logoSubtitle}
              </p>
            </div>
          </div>

          {logoLoading ? (
            <div className="mt-4 space-y-3">
              <div className="h-6 w-1/3 animate-pulse rounded bg-slate-200" />
              <div className="h-28 w-full animate-pulse rounded bg-slate-200" />
              <div className="h-10 w-full animate-pulse rounded bg-slate-200" />
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <img
                  src={
                    logoPreviewUrl ||
                    (logoImageFailed
                      ? "/next.svg"
                      : logoUrl || "/next.svg")
                  }
                  alt={text.logoPreviewAlt}
                  className="h-20 max-w-full rounded-md object-contain"
                  onError={() => setLogoImageFailed(true)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  {language === "ar" ? "اسم الموقع (بالعربية)" : "Website Name (Arabic)"}
                </label>
                <Input
                  value={footerWebsiteNameAr}
                  onChange={(event) => setFooterWebsiteNameAr(event.target.value)}
                  placeholder={language === "ar" ? "اسم الموقع بالعربية" : "Website name in Arabic"}
                  dir="rtl"
                  className="text-right"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  {text.uploadLogo}
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                  onChange={(event) =>
                    setLogoFile(event.target.files?.[0] ?? null)
                  }
                  className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
                />
              </div>
              {logoError ? (
                <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {logoError}
                </p>
              ) : null}
              {logoSuccess ? (
                <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {logoSuccess}
                </p>
              ) : null}
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setLogoFile(null);
                    setLogoPreviewUrl("");
                    setLogoError("");
                    setLogoSuccess("");
                    setLogoImageFailed(false);
                  }}
                  disabled={isLogoSaving}
                >
                  {text.reset}
                </Button>
                <Button onClick={handleLogoSave} disabled={isLogoSaving}>
                  {isLogoSaving ? text.saving : text.saveLogo}
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {text.footerSettings}
              </h2>
              <p className="text-sm text-slate-500">
                {text.footerSubtitle}
              </p>
            </div>
          </div>

          {footerLoading ? (
            <div className="mt-4 space-y-3">
              <div className="h-6 w-1/3 animate-pulse rounded bg-slate-200" />
              <div className="h-10 w-full animate-pulse rounded bg-slate-200" />
              <div className="h-10 w-full animate-pulse rounded bg-slate-200" />
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  {text.websiteName}
                </label>
                <Input
                  value={footerWebsiteNameEn}
                  onChange={(event) => setFooterWebsiteNameEn(event.target.value)}
                  placeholder={text.websiteName}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  {text.copyrightText}
                </label>
                <Input
                  value={footerCopyrightEn}
                  onChange={(event) => setFooterCopyrightEn(event.target.value)}
                  placeholder="© 2026 by Your Name. All rights reserved."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  {language === "ar" ? "نص حقوق النشر (بالعربية)" : "Copyright Text (Arabic)"}
                </label>
                <Input
                  value={footerCopyrightAr}
                  onChange={(event) => setFooterCopyrightAr(event.target.value)}
                  placeholder={language === "ar" ? "أدخل نص حقوق النشر بالعربية" : "Enter Arabic copyright text"}
                  dir="rtl"
                  className="text-right"
                />
              </div>
              {footerError ? (
                <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {footerError}
                </p>
              ) : null}
              {footerSuccess ? (
                <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {footerSuccess}
                </p>
              ) : null}
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setFooterWebsiteNameEn(footerInitial?.websiteNameEn ?? "");
                    setFooterWebsiteNameAr(footerInitial?.websiteNameAr ?? "");
                    setFooterCopyrightEn(footerInitial?.copyrightTextEn ?? "");
                    setFooterCopyrightAr(footerInitial?.copyrightTextAr ?? "");
                    setFooterError("");
                    setFooterSuccess("");
                  }}
                  disabled={isFooterSaving}
                >
                  {text.reset}
                </Button>
                <Button onClick={handleFooterSave} disabled={isFooterSaving}>
                  {isFooterSaving ? text.saving : text.saveFooter}
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-6 w-1/3 animate-pulse rounded bg-slate-200" />
              <div className="h-40 w-full animate-pulse rounded bg-slate-200" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-slate-900">
                  {text.heroSection}
                </h2>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt={text.heroPreviewAlt}
                      className="h-48 w-full rounded-md object-cover"
                    />
                  ) : (
                    <div className="flex h-48 items-center justify-center rounded-md border border-dashed border-slate-300 text-sm text-slate-500">
                      {text.noImageSelected}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    {text.heroBannerImage}
                  </label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={(event) =>
                      setHeroImageFile(event.target.files?.[0] ?? null)
                    }
                    className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center justify-between gap-4 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">
                  {text.newCollectionIcon}
                  <input
                    type="checkbox"
                    checked={showNewCollection}
                    onChange={(event) => setShowNewCollection(event.target.checked)}
                    className="h-5 w-5 accent-slate-900"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    {language === "ar" ? "النص الرئيسي 1 (بالإنجليزية)" : "Primary Hero Text 1 (English)"}
                  </label>
                  <textarea
                    value={heroTextPrimaryEn}
                    onChange={(event) => setHeroTextPrimaryEn(event.target.value)}
                    className="min-h-[90px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    {language === "ar" ? "النص الرئيسي 1 (بالعربية)" : "Primary Hero Text 1 (Arabic)"}
                  </label>
                  <textarea
                    value={heroTextPrimaryAr}
                    onChange={(event) => setHeroTextPrimaryAr(event.target.value)}
                    dir="rtl"
                    className="min-h-[90px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-right text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    {language === "ar" ? "النص الثانوي 2 (بالإنجليزية)" : "Secondary Hero Text 2 (English)"}
                  </label>
                  <textarea
                    value={heroTextSecondaryEn}
                    onChange={(event) => setHeroTextSecondaryEn(event.target.value)}
                    className="min-h-[90px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    {language === "ar" ? "النص الثانوي 2 (بالعربية)" : "Secondary Hero Text 2 (Arabic)"}
                  </label>
                  <textarea
                    value={heroTextSecondaryAr}
                    onChange={(event) => setHeroTextSecondaryAr(event.target.value)}
                    dir="rtl"
                    className="min-h-[90px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-right text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  />
                </div>
              </div>

              {error ? (
                <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </p>
              ) : null}
              {success ? (
                <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {success}
                </p>
              ) : null}

              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={handleReset}
                  disabled={isSubmitting}
                >
                  {text.reset}
                </Button>
                <Button onClick={handleSave} disabled={isSubmitting}>
                  {isSubmitting ? text.saving : text.saveChanges}
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {text.heroDataControl}
              </h2>
              <p className="text-sm text-slate-500">
                {text.heroDataSubtitle}
              </p>
            </div>
            <Button onClick={openAddHeroStat}>{text.addHeroData}</Button>
          </div>

          {heroStatsLoading ? (
            <div className="mt-4 space-y-3">
              <div className="h-8 w-full animate-pulse rounded bg-slate-200" />
              <div className="h-8 w-full animate-pulse rounded bg-slate-200" />
            </div>
          ) : heroStatsError ? (
            <p className="mt-4 text-sm text-rose-600">{heroStatsError}</p>
          ) : heroStats.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              {text.noHeroData}
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="py-2 pr-4 font-medium">{text.value}</th>
                    <th className="py-2 pr-4 font-medium">{text.labelText}</th>
                    <th className="py-2 pr-4 font-medium">{text.order}</th>
                    <th className="py-2 pr-4 font-medium">{text.status}</th>
                    <th className="py-2 font-medium">{text.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {heroStats
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((stat) => (
                      <tr key={stat.id} className="text-slate-700">
                        <td className="py-3 pr-4">{stat.value}</td>
                        <td className="py-3 pr-4">
                          <LocalizedDisplayText
                            valueEn={stat.textEn}
                            valueAr={stat.textAr}
                            legacyValue={stat.text}
                          />
                        </td>
                        <td className="py-3 pr-4">{stat.order}</td>
                        <td className="py-3 pr-4">
                          {stat.isActive ? text.active : text.inactive}
                        </td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="secondary"
                              onClick={() => openEditHeroStat(stat)}
                            >
                              {text.edit}
                            </Button>
                            <Button
                              variant="danger"
                              onClick={() => openDeleteHeroStat(stat)}
                            >
                              {text.delete}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {text.socialMediaLinks}
              </h2>
              <p className="text-sm text-slate-500">
                {text.socialSubtitle}
              </p>
            </div>
          </div>

          {socialLoading ? (
            <div className="mt-4 space-y-3">
              <div className="h-10 w-full animate-pulse rounded bg-slate-200" />
              <div className="h-10 w-full animate-pulse rounded bg-slate-200" />
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {socialLinks.map((link) => {
                const label =
                  SOCIAL_PLATFORMS.find((item) => item.key === link.platform)
                    ?.label ?? link.platform;
                return (
                  <div
                    key={link.platform}
                    className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 px-3 py-3"
                  >
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white">
                        {renderSocialIcon(link.platform)}
                      </span>
                      {label}
                    </div>
                    <input
                      type="url"
                      value={link.url ?? ""}
                      onChange={(event) =>
                        updateSocialLink(
                          link.platform,
                          "url",
                          event.target.value
                        )
                      }
                      placeholder="https://"
                      disabled={!link.isActive}
                      className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                    />
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={link.isActive}
                        onChange={(event) =>
                          updateSocialLink(
                            link.platform,
                            "isActive",
                            event.target.checked
                          )
                        }
                        className="h-4 w-4 accent-slate-900"
                      />
                      {text.active}
                    </label>
                    <Button
                      variant="secondary"
                      onClick={() => saveSocialLink(link.platform)}
                      disabled={socialSaving[link.platform]}
                    >
                      {socialSaving[link.platform] ? text.saving : text.save}
                    </Button>
                  </div>
                );
              })}
              {socialError ? (
                <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {socialError}
                </p>
              ) : null}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {text.whyShop}
              </h2>
              <p className="text-sm text-slate-500">
                {text.whyShopSubtitle}
              </p>
            </div>
            <Button onClick={openAddWhyShop}>{text.addCard}</Button>
          </div>

          {whyShopLoading ? (
            <div className="mt-4 space-y-3">
              <div className="h-8 w-full animate-pulse rounded bg-slate-200" />
              <div className="h-8 w-full animate-pulse rounded bg-slate-200" />
            </div>
          ) : whyShopError ? (
            <p className="mt-4 text-sm text-rose-600">{whyShopError}</p>
          ) : whyShopCards.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              {text.noCards}
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="py-2 pr-4 font-medium">{text.labelText}</th>
                    <th className="py-2 pr-4 font-medium">{text.description}</th>
                    <th className="py-2 pr-4 font-medium">{text.order}</th>
                    <th className="py-2 pr-4 font-medium">{text.status}</th>
                    <th className="py-2 font-medium">{text.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {whyShopCards
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((card) => (
                      <tr key={card.id} className="text-slate-700">
                        <td className="py-3 pr-4">
                          <LocalizedDisplayText
                            valueEn={card.titleEn}
                            valueAr={card.titleAr}
                            legacyValue={card.title}
                          />
                        </td>
                        <td className="py-3 pr-4">
                          <LocalizedDisplayText
                            valueEn={card.descriptionEn}
                            valueAr={card.descriptionAr}
                            legacyValue={card.description}
                          />
                        </td>
                        <td className="py-3 pr-4">
                          <input
                            type="number"
                            defaultValue={card.order}
                            onBlur={(event) =>
                              updateWhyShopOrder(card, event.target.value)
                            }
                            className="w-24 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                          />
                          {whyShopSaving[card.id] ? (
                            <span className="ml-2 text-xs text-slate-500">
                              {text.saving}
                            </span>
                          ) : null}
                        </td>
                        <td className="py-3 pr-4">
                          {card.isActive ? text.active : text.inactive}
                        </td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="secondary"
                              onClick={() => openEditWhyShop(card)}
                            >
                              {text.edit}
                            </Button>
                            <Button
                              variant="danger"
                              onClick={() => openDeleteWhyShop(card)}
                            >
                              {text.delete}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal
        title={editingHeroStat ? text.editHeroData : text.addHeroDataTitle}
        isOpen={isHeroStatModalOpen}
        onClose={() => setIsHeroStatModalOpen(false)}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{text.value}</label>
            <Input
              value={heroStatValue}
              onChange={(event) => setHeroStatValue(event.target.value)}
              placeholder={text.enterValue}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              {language === "ar" ? "النص (بالإنجليزية)" : "Text (English)"}
            </label>
            <Input
              value={heroStatTextEn}
              onChange={(event) => setHeroStatTextEn(event.target.value)}
              placeholder={text.enterText}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              {language === "ar" ? "النص (بالعربية)" : "Text (Arabic)"}
            </label>
            <Input
              value={heroStatTextAr}
              onChange={(event) => setHeroStatTextAr(event.target.value)}
              placeholder={text.enterText}
              dir="rtl"
              className="text-right"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{text.order}</label>
            <Input
              type="number"
              value={heroStatOrder}
              onChange={(event) => setHeroStatOrder(event.target.value)}
              placeholder={text.order}
            />
          </div>
          <label className="flex items-center justify-between gap-4 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">
            {text.active}
            <input
              type="checkbox"
              checked={heroStatActive}
              onChange={(event) => setHeroStatActive(event.target.checked)}
              className="h-5 w-5 accent-slate-900"
            />
          </label>
          {heroStatsError ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {heroStatsError}
            </p>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setIsHeroStatModalOpen(false)}
              disabled={isSubmitting}
            >
              {text.cancel}
            </Button>
            <Button onClick={saveHeroStat} disabled={isSubmitting}>
              {isSubmitting ? text.saving : text.save}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        title={editingWhyShop ? text.editCard : text.addCardTitle}
        isOpen={isWhyShopModalOpen}
        onClose={() => setIsWhyShopModalOpen(false)}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              {language === "ar" ? "العنوان (بالإنجليزية)" : "Title (English)"}
            </label>
            <Input
              value={whyShopTitleEn}
              onChange={(event) => setWhyShopTitleEn(event.target.value)}
              placeholder={text.enterTitle}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              {language === "ar" ? "العنوان (بالعربية)" : "Title (Arabic)"}
            </label>
            <Input
              value={whyShopTitleAr}
              onChange={(event) => setWhyShopTitleAr(event.target.value)}
              placeholder={text.enterTitle}
              dir="rtl"
              className="text-right"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              {language === "ar" ? "الوصف (بالإنجليزية)" : "Description (English)"}
            </label>
            <textarea
              value={whyShopDescriptionEn}
              onChange={(event) => setWhyShopDescriptionEn(event.target.value)}
              className="min-h-[90px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              {language === "ar" ? "الوصف (بالعربية)" : "Description (Arabic)"}
            </label>
            <textarea
              value={whyShopDescriptionAr}
              onChange={(event) => setWhyShopDescriptionAr(event.target.value)}
              dir="rtl"
              className="min-h-[90px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-right text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{text.order}</label>
            <Input
              type="number"
              value={whyShopOrder}
              onChange={(event) => setWhyShopOrder(event.target.value)}
              placeholder={text.order}
            />
          </div>
          <label className="flex items-center justify-between gap-4 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">
            {text.active}
            <input
              type="checkbox"
              checked={whyShopActive}
              onChange={(event) => setWhyShopActive(event.target.checked)}
              className="h-5 w-5 accent-slate-900"
            />
          </label>
          {whyShopError ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {whyShopError}
            </p>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setIsWhyShopModalOpen(false)}
              disabled={isSubmitting}
            >
              {text.cancel}
            </Button>
            <Button onClick={saveWhyShop} disabled={isSubmitting}>
              {isSubmitting ? text.saving : text.save}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        title={text.deleteCard}
        isOpen={isWhyShopDeleteOpen}
        onClose={() => setIsWhyShopDeleteOpen(false)}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            {text.deleteCardBody}
          </p>
          {whyShopError ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {whyShopError}
            </p>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setIsWhyShopDeleteOpen(false)}
              disabled={isSubmitting}
            >
              {text.cancel}
            </Button>
            <Button
              variant="danger"
              onClick={deleteWhyShop}
              disabled={isSubmitting}
            >
              {isSubmitting ? text.deleting : text.delete}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        title={text.deleteHeroData}
        isOpen={isDeleteHeroStatOpen}
        onClose={() => setIsDeleteHeroStatOpen(false)}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            {text.deleteHeroDataBody}
          </p>
          {heroStatsError ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {heroStatsError}
            </p>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteHeroStatOpen(false)}
              disabled={isSubmitting}
            >
              {text.cancel}
            </Button>
            <Button
              variant="danger"
              onClick={deleteHeroStat}
              disabled={isSubmitting}
            >
              {isSubmitting ? text.deleting : text.delete}
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
