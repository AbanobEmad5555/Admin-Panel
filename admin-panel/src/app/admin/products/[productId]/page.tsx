"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AdminLayout from "@/components/layout/AdminLayout";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import PurchaseStatusBadge from "@/components/purchases/PurchaseStatusBadge";
import type { PurchaseRow } from "@/components/purchases/types";
import { purchasesApi } from "@/features/purchases/api/purchases.api";
import { extractList } from "@/lib/extractList";
import { useLocalization } from "@/modules/localization/LocalizationProvider";
import api from "@/services/api";

type Product = {
  id?: number | string;
  name?: string | null;
  status?: string | null;
  isActive?: boolean | null;
  createdAt?: string | null;
  created_at?: string | null;
  category?: { id?: number | null; name?: string | null } | null;
  categoryId?: number | null;
  price?: number | string | null;
  priceBeforeDiscount?: number | string | null;
  priceAfterDiscount?: number | string | null;
  stock?: number | string | null;
  description?: string | null;
  images?: string[] | string | null;
  image?: string | null;
  imageUrl?: string | null;
  image_url?: string | null;
  imageUrls?: string[] | string | null;
  imagesUrl?: string[] | string | null;
  images_url?: string[] | string | null;
  variant?: {
    sku?: string | null;
    name?: string | null;
    status?: string | null;
    isActive?: boolean | null;
    size?: string | null;
    color?: string | null;
    material?: string | null;
    attributes?: {
      size?: string | null;
      color?: string | null;
      material?: string | null;
    } | null;
  } | null;
  variantId?: number | null;
  variantAttributes?: {
    size?: string | null;
    color?: string | null;
    material?: string | null;
  } | null;
};

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  message?: string;
};

type Category = {
  id: number;
  name: string;
};

type Variant = {
  id: number;
  sku?: string | null;
  name?: string | null;
};

const formatDate = (value?: string | null) => {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatCurrency = (value: number) =>
  `${new Intl.NumberFormat("en-EG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)} EGP`;

const toNumberValue = (value: unknown) => {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

const toNumber = (value: string) => {
  if (value.trim() === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const getErrorMessage = (error: unknown) => {
  if (typeof error === "object" && error !== null) {
    const anyError = error as { response?: { data?: { message?: string } } };
    return anyError.response?.data?.message ?? "Something went wrong.";
  }
  return "Something went wrong.";
};

const extractImagesList = (images: unknown) => {
  if (!images) {
    return [];
  }
  if (Array.isArray(images)) {
    return images
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }
        if (item && typeof item === "object") {
          const record = item as Record<string, unknown>;
          return (
            (record.url as string) ||
            (record.imageUrl as string) ||
            (record.image_url as string) ||
            (record.path as string) ||
            (record.image as string) ||
            ""
          );
        }
        return "";
      })
      .filter(Boolean);
  }
  if (typeof images === "string") {
    if (images.trim().startsWith("[")) {
      try {
        const parsed = JSON.parse(images);
        return extractImagesList(parsed);
      } catch {
        return images ? [images] : [];
      }
    }
    return images ? [images] : [];
  }
  if (typeof images === "object") {
    const record = images as Record<string, unknown>;
    const candidate =
      (record.url as string) ||
      (record.imageUrl as string) ||
      (record.image_url as string) ||
      (record.path as string) ||
      (record.image as string);
    return candidate ? [candidate] : [];
  }
  return [];
};

const resolveImageUrl = (raw: string) => {
  if (!raw) {
    return "";
  }
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  return `${base.replace(/\/$/, "")}/${raw.replace(/^\//, "")}`;
};

const resolveStatusLabel = (product: Product) => {
  if (typeof product.isActive === "boolean") {
    return product.isActive ? "Active" : "Inactive";
  }
  if (product.status) {
    return product.status.toLowerCase() === "active" ? "Active" : "Inactive";
  }
  return "Inactive";
};

const resolveStatusBadge = (product: Product) => {
  const active =
    typeof product.isActive === "boolean"
      ? product.isActive
      : product.status?.toLowerCase() === "active";
  return active ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700";
};

const resolveVariantDetails = (product: Product) => {
  const variant = product.variant ?? {};
  const attributes = variant.attributes ?? product.variantAttributes ?? {};
  return {
    sku: variant.sku || variant.name || (product.variantId ? `Variant #${product.variantId}` : "-"),
    size: attributes.size ?? variant.size ?? "-",
    color: attributes.color ?? variant.color ?? "-",
    material: attributes.material ?? variant.material ?? "-",
    status:
      typeof variant.isActive === "boolean"
        ? variant.isActive
          ? "Active"
          : "Inactive"
        : variant.status ?? "-",
  };
};

export default function ProductDetailsPage() {
  const { language } = useLocalization();
  const params = useParams();
  const router = useRouter();
  const productId = Array.isArray(params?.productId)
    ? params?.productId[0]
    : params?.productId;

  const [product, setProduct] = useState<Product | null>(null);
  const [purchaseRows, setPurchaseRows] = useState<PurchaseRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [toastError, setToastError] = useState("");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "purchases">("overview");

  const [nameInput, setNameInput] = useState("");
  const [priceBeforeInput, setPriceBeforeInput] = useState("");
  const [priceAfterInput, setPriceAfterInput] = useState("");
  const [stockInput, setStockInput] = useState("");
  const [statusInput, setStatusInput] = useState("active");
  const [categoryIdInput, setCategoryIdInput] = useState("");
  const [variantIdInput, setVariantIdInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [actionError, setActionError] = useState("");
  const [editImageInputs, setEditImageInputs] = useState<Array<File | null>>([]);
  const [existingEditImages, setExistingEditImages] = useState<string[]>([]);
  const [imagesTouched, setImagesTouched] = useState(false);
  const text =
    language === "ar"
      ? {
          invalidProductId: "رقم المنتج غير صالح.",
          imageUploadFailed: "فشل رفع الصور.",
          noChanges: "لا توجد تغييرات للتحديث.",
          updatedSuccess: "تم تحديث المنتج بنجاح.",
          activated: "تم تفعيل المنتج.",
          deactivated: "تم تعطيل المنتج.",
          products: "المنتجات",
          productDetails: "تفاصيل المنتج",
          backToProducts: "العودة إلى المنتجات",
          editProduct: "تعديل المنتج",
          deactivateProduct: "تعطيل المنتج",
          activateProduct: "تفعيل المنتج",
          deleteProduct: "حذف المنتج",
          overviewTab: "نظرة عامة",
          purchasesTab: "المشتريات",
          productNotFound: "المنتج غير موجود.",
          productOverview: "نظرة عامة على المنتج",
          productName: "اسم المنتج",
          status: "الحالة",
          category: "الفئة",
          createdAt: "تاريخ الإنشاء",
          pricingAndStock: "السعر والمخزون",
          priceBeforeDiscount: "السعر قبل الخصم",
          priceAfterDiscount: "السعر بعد الخصم",
          stock: "المخزون",
          variantDetails: "تفاصيل المتغير",
          sku: "رمز SKU",
          size: "المقاس",
          color: "اللون",
          material: "الخامة",
          variantStatus: "حالة المتغير",
          productImages: "صور المنتج",
          noImagesAvailable: "لا توجد صور متاحة.",
          productDescription: "وصف المنتج",
          noDescription: "لا يوجد وصف.",
          purchaseHistory: "سجل مشتريات المنتج",
          purchaseHistorySubtitle: "تتبع أوامر الشراء ووصولات الموردين لهذا المنتج.",
          purchaseId: "رقم الشراء",
          supplier: "المورد",
          quantity: "الكمية",
          unitCost: "تكلفة الوحدة",
          arrivalDate: "تاريخ الوصول",
          noPurchaseHistory: "لا يوجد سجل مشتريات لهذا المنتج.",
          editProductTitle: "تعديل المنتج",
          enterProductName: "أدخل اسم المنتج",
          priceBefore: "السعر قبل الخصم",
          priceAfter: "السعر بعد الخصم",
          selectCategory: "اختر الفئة",
          variant: "المتغير",
          selectVariant: "اختر المتغير",
          active: "نشط",
          inactive: "غير نشط",
          description: "الوصف",
          optionalDescription: "وصف اختياري",
          existingImage: (n: number) => `الصورة الحالية ${n}`,
          remove: "إزالة",
          productImage: (n: number) => `صورة المنتج ${n}`,
          addNewImage: "إضافة صورة جديدة",
          maxImages: "الحد الأقصى 5 صور",
          cancel: "إلغاء",
          updating: "جارٍ التحديث...",
          update: "تحديث",
          deleteProductTitle: "حذف المنتج",
          deleteConfirm: "هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء.",
          deleting: "جارٍ الحذف...",
          delete: "حذف",
        }
      : {
          invalidProductId: "Invalid product id.",
          imageUploadFailed: "Image upload failed.",
          noChanges: "No changes to update.",
          updatedSuccess: "Product updated successfully.",
          activated: "Product activated.",
          deactivated: "Product deactivated.",
          products: "Products",
          productDetails: "Product Details",
          backToProducts: "Back to Products",
          editProduct: "Edit Product",
          deactivateProduct: "Deactivate Product",
          activateProduct: "Activate Product",
          deleteProduct: "Delete Product",
          overviewTab: "Overview",
          purchasesTab: "Purchases",
          productNotFound: "Product not found.",
          productOverview: "Product Overview",
          productName: "Product Name",
          status: "Status",
          category: "Category",
          createdAt: "Created At",
          pricingAndStock: "Pricing & Stock",
          priceBeforeDiscount: "Price Before Discount",
          priceAfterDiscount: "Price After Discount",
          stock: "Stock",
          variantDetails: "Variant Details",
          sku: "SKU",
          size: "Size",
          color: "Color",
          material: "Material",
          variantStatus: "Variant Status",
          productImages: "Product Images",
          noImagesAvailable: "No images available.",
          productDescription: "Product Description",
          noDescription: "No description provided.",
          purchaseHistory: "Product Purchase History",
          purchaseHistorySubtitle: "Track purchase orders and supplier deliveries for this product.",
          purchaseId: "Purchase ID",
          supplier: "Supplier",
          quantity: "Quantity",
          unitCost: "Unit Cost",
          arrivalDate: "Arrival Date",
          noPurchaseHistory: "No purchase history found for this product.",
          editProductTitle: "Edit Product",
          enterProductName: "Enter product name",
          priceBefore: "Price Before",
          priceAfter: "Price After",
          selectCategory: "Select category",
          variant: "Variant",
          selectVariant: "Select variant",
          active: "Active",
          inactive: "Not Active",
          description: "Description",
          optionalDescription: "Optional description",
          existingImage: (n: number) => `Existing ${n}`,
          remove: "Remove",
          productImage: (n: number) => `Product Image ${n}`,
          addNewImage: "Add New Image",
          maxImages: "Maximum 5 images allowed",
          cancel: "Cancel",
          updating: "Updating...",
          update: "Update",
          deleteProductTitle: "Delete Product",
          deleteConfirm: "Are you sure you want to delete this product? This action cannot be undone.",
          deleting: "Deleting...",
          delete: "Delete",
        };

  const images = useMemo(() => {
    if (!product) {
      return [];
    }
    const list = [
      ...extractImagesList(product.images),
      ...extractImagesList(product.imageUrls),
      ...extractImagesList(product.imagesUrl),
      ...extractImagesList(product.images_url),
      ...extractImagesList(product.imageUrl),
      ...extractImagesList(product.image_url),
      ...extractImagesList(product.image),
    ];
    const unique = Array.from(new Set(list.filter(Boolean)));
    return unique.slice(0, 5).map(resolveImageUrl);
  }, [product]);

  const variantDetails = useMemo(
    () => resolveVariantDetails(product ?? {}),
    [product]
  );

  const productPurchaseHistory = useMemo(() => {
    const numericProductId = Number(product?.id);
    const productName = product?.name?.trim().toLowerCase();
    if (!productName && Number.isNaN(numericProductId)) {
      return [];
    }
    return purchaseRows.filter((row) => {
      if (!Number.isNaN(numericProductId) && row.productId === numericProductId) {
        return true;
      }
      const purchaseName = row.productName.trim().toLowerCase();
      return purchaseName === productName || purchaseName.startsWith(`${productName} - `);
    });
  }, [product?.id, product?.name, purchaseRows]);

  useEffect(() => {
    if (!productId) {
      return;
    }
    let mounted = true;
    const loadPurchases = async () => {
      try {
        const rows = await purchasesApi.listByProduct(String(productId));
        if (mounted) {
          setPurchaseRows(rows);
        }
      } catch {
        if (mounted) {
          setPurchaseRows([]);
        }
      }
    };
    void loadPurchases();
    return () => {
      mounted = false;
    };
  }, [productId]);

  useEffect(() => {
    if (!productId) {
      setError(language === "ar" ? "رقم المنتج غير صالح." : "Invalid product id.");
      setIsLoading(false);
      return;
    }
    const loadProduct = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await api.get<ApiResponse<Product>>(
          `/admin/products/${productId}`
        );
        const responseRecord = (response.data ?? {}) as Record<string, unknown>;
        const dataRecord = (responseRecord.data ?? {}) as Record<string, unknown>;
        const payload = ((dataRecord.product ??
          responseRecord.product ??
          responseRecord.data ??
          responseRecord) ?? null) as Product | null;
        setProduct(payload ?? null);
        if (payload) {
          setNameInput(payload.name ?? "");
          setPriceBeforeInput(
            payload.priceBeforeDiscount?.toString() ??
              payload.price?.toString() ??
              ""
          );
          setPriceAfterInput(payload.priceAfterDiscount?.toString() ?? "");
          setStockInput(payload.stock?.toString() ?? "");
          const isActive =
            typeof payload.isActive === "boolean"
              ? payload.isActive
              : payload.status?.toLowerCase() === "active";
          setStatusInput(isActive ? "active" : "inactive");
          setCategoryIdInput(
            payload.categoryId?.toString() ?? payload.category?.id?.toString() ?? ""
          );
          setVariantIdInput(payload.variantId?.toString() ?? "");
          setDescriptionInput(payload.description ?? "");
          const existingImages = extractImagesList(payload.images)
            .concat(extractImagesList(payload.imageUrls))
            .concat(extractImagesList(payload.imagesUrl))
            .concat(extractImagesList(payload.images_url))
            .concat(extractImagesList(payload.imageUrl))
            .concat(extractImagesList(payload.image_url))
            .concat(extractImagesList(payload.image))
            .filter(Boolean);
          setExistingEditImages(Array.from(new Set(existingImages)));
          setEditImageInputs([]);
          setImagesTouched(false);
          setSelectedImage(
            existingImages.length > 0
              ? resolveImageUrl(existingImages[0])
              : null
          );
        }
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [language, productId]);

  useEffect(() => {
    if (images.length === 0) {
      setSelectedImage(null);
      return;
    }
    setSelectedImage((prev) => prev ?? images[0]);
  }, [images]);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [categoriesResponse, variantsResponse] = await Promise.all([
          api.get<ApiResponse<Category[]>>("/categories"),
          api.get<ApiResponse<Variant[]>>("/variants"),
        ]);
        setCategories(extractList<Category>(categoriesResponse.data?.data ?? categoriesResponse.data));
        setVariants(extractList<Variant>(variantsResponse.data?.data ?? variantsResponse.data));
      } catch {
        setCategories([]);
        setVariants([]);
      }
    };

    loadMeta();
  }, []);

  useEffect(() => {
    if (!toastMessage && !toastError) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setToastMessage("");
      setToastError("");
    }, 5000);
    return () => window.clearTimeout(timeout);
  }, [toastMessage, toastError]);

  const handleToggleStatus = async () => {
    if (!product) {
      return;
    }
    const nextStatus =
      typeof product.isActive === "boolean"
        ? !product.isActive
        : product.status?.toLowerCase() !== "active";
    setIsSubmitting(true);
    setToastMessage("");
    setToastError("");
    try {
      await api.put(`/products/${productId}`, { isActive: nextStatus });
      setProduct((prev) =>
        prev ? { ...prev, isActive: nextStatus, status: nextStatus ? "active" : "inactive" } : prev
      );
      setToastMessage(nextStatus ? text.activated : text.deactivated);
    } catch (err) {
      setToastError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!product) {
      return;
    }
    setIsSubmitting(true);
    setToastMessage("");
    setToastError("");
    try {
      await api.delete(`/products/${productId}`);
      router.push("/admin/products");
    } catch (err) {
      setToastError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
      setIsDeleteOpen(false);
    }
  };

  const openEditModal = () => {
    if (!product) {
      return;
    }
    setActionError("");
    setEditImageInputs([]);
    setImagesTouched(false);
    setIsEditOpen(true);
  };

  const uploadImages = async (files: File[]) => {
    if (files.length === 0) {
      return [];
    }
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("images", file);
    });
    const response = await api.post("/upload/product-images", formData);
    const urls = response.data?.data?.urls ?? response.data?.urls ?? [];
    return Array.isArray(urls) ? urls : [];
  };

  const handleEdit = async () => {
    if (!product) {
      return;
    }
    setIsSubmitting(true);
    setActionError("");
    setToastMessage("");
    setToastError("");
    try {
      const filesToUpload = editImageInputs.filter(
        (file): file is File => file instanceof File
      );
      let uploadedUrls: string[] = [];
      if (filesToUpload.length > 0) {
        uploadedUrls = await uploadImages(filesToUpload);
        if (uploadedUrls.length === 0) {
          setActionError(text.imageUploadFailed);
          return;
        }
      }
      const payload: Record<string, unknown> = {};
      const nextName = nameInput.trim();
      if (nextName && nextName !== product.name) {
        payload.name = nextName;
      }
      const nextPriceBefore = toNumber(priceBeforeInput);
      if (
        nextPriceBefore !== null &&
        nextPriceBefore !== toNumberValue(product.priceBeforeDiscount)
      ) {
        payload.priceBeforeDiscount = nextPriceBefore;
      }
      const nextPriceAfter = toNumber(priceAfterInput);
      if (
        nextPriceAfter !== null &&
        nextPriceAfter !== toNumberValue(product.priceAfterDiscount)
      ) {
        payload.priceAfterDiscount = nextPriceAfter;
      }
      const nextStock = toNumber(stockInput);
      if (nextStock !== null && nextStock !== toNumberValue(product.stock)) {
        payload.stock = nextStock;
      }
      const nextCategoryId = toNumber(categoryIdInput);
      if (
        nextCategoryId !== null &&
        nextCategoryId !== product.categoryId
      ) {
        payload.categoryId = nextCategoryId;
      }
      const nextVariantId = toNumber(variantIdInput);
      if (
        nextVariantId !== null &&
        nextVariantId !== product.variantId
      ) {
        payload.variantId = nextVariantId;
      }
      const nextDescription = descriptionInput.trim();
      if (nextDescription !== (product.description ?? "")) {
        payload.description = nextDescription;
      }
      const nextIsActive = statusInput.trim().toLowerCase() === "active";
      const currentIsActive =
        typeof product.isActive === "boolean"
          ? product.isActive
          : product.status?.toLowerCase() === "active";
      if (nextIsActive !== currentIsActive) {
        payload.isActive = nextIsActive;
      }
      if (imagesTouched) {
        payload.images = [...existingEditImages, ...uploadedUrls];
      }
      if (Object.keys(payload).length === 0) {
        setActionError(text.noChanges);
        return;
      }
      await api.put(`/products/${productId}`, payload);
      setProduct((prev) => (prev ? { ...prev, ...payload } : prev));
      if (imagesTouched) {
        const nextImages = payload.images as string[] | undefined;
        if (nextImages) {
          setExistingEditImages(nextImages);
        }
        setEditImageInputs([]);
        setImagesTouched(false);
      }
      setIsEditOpen(false);
      setToastMessage(text.updatedSuccess);
    } catch (err) {
      const message = getErrorMessage(err);
      setActionError(message);
      setToastError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const priceBefore = toNumberValue(
    product?.priceBeforeDiscount ?? product?.price
  );
  const priceAfter = toNumberValue(product?.priceAfterDiscount);
  const stockValue = toNumberValue(product?.stock);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm text-slate-500">
                <Link href="/admin/products" className="hover:text-slate-700">
                {text.products}
              </Link>{" "}
              / {text.productDetails}
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {product?.name ?? text.productDetails}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/products"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
            >
              {text.backToProducts}
            </Link>
            <Button variant="secondary" onClick={openEditModal} disabled={!product}>
              {text.editProduct}
            </Button>
            <Button
              variant="secondary"
              onClick={handleToggleStatus}
              disabled={isSubmitting || !product}
            >
              {resolveStatusLabel(product ?? {}) === "Active"
                ? text.deactivateProduct
                : text.activateProduct}
            </Button>
            <Button
              variant="danger"
              onClick={() => setIsDeleteOpen(true)}
              disabled={isSubmitting || !product}
            >
              {text.deleteProduct}
            </Button>
          </div>
        </div>

        {toastMessage ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
            {toastMessage}
          </div>
        ) : null}
        {toastError ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
            {toastError}
          </div>
        ) : null}

        <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                activeTab === "overview"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {text.overviewTab}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("purchases")}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                activeTab === "purchases"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {text.purchasesTab}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <div className="h-10 w-full animate-pulse rounded bg-slate-200" />
            <div className="h-10 w-full animate-pulse rounded bg-slate-200" />
            <div className="h-10 w-full animate-pulse rounded bg-slate-200" />
          </div>
        ) : error ? (
          <p className="text-sm text-rose-600">{error}</p>
        ) : !product ? (
          <p className="text-sm text-slate-500">{text.productNotFound}</p>
        ) : (
          <>
            {activeTab === "overview" ? (
              <div className="space-y-6">
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <h2 className="text-base font-semibold text-slate-900">
                      {text.productOverview}
                    </h2>
                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                      <div className="flex items-center justify-between">
                        <span>{text.productName}</span>
                        <span className="font-medium text-slate-900">
                          {product.name ?? "-"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{text.status}</span>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${resolveStatusBadge(
                            product
                          )}`}
                        >
                          {resolveStatusLabel(product)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{text.category}</span>
                        <span className="text-slate-900">
                          {product.category?.name ?? "-"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{text.createdAt}</span>
                        <span className="text-slate-900">
                          {formatDate(product.createdAt ?? product.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <h2 className="text-base font-semibold text-slate-900">
                      {text.pricingAndStock}
                    </h2>
                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                      <div className="flex items-center justify-between">
                        <span>{text.priceBeforeDiscount}</span>
                        <span className="text-slate-900">
                          {priceBefore !== null ? formatCurrency(priceBefore) : "-"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{text.priceAfterDiscount}</span>
                        <span className="text-slate-900">
                          {priceAfter !== null ? formatCurrency(priceAfter) : "-"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{text.stock}</span>
                        <span className="text-slate-900">
                          {stockValue !== null ? stockValue : "-"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <h2 className="text-base font-semibold text-slate-900">
                      {text.variantDetails}
                    </h2>
                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                      <div className="flex items-center justify-between">
                        <span>{text.sku}</span>
                        <span className="text-slate-900">{variantDetails.sku}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{text.size}</span>
                        <span className="text-slate-900">{variantDetails.size}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{text.color}</span>
                        <span className="flex items-center gap-2 text-slate-900">
                          <span
                            className="h-3 w-3 rounded-full border border-slate-200"
                            style={{ backgroundColor: variantDetails.color ?? "#000000" }}
                          />
                          {variantDetails.color}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{text.material}</span>
                        <span className="text-slate-900">
                          {variantDetails.material}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{text.variantStatus}</span>
                        <span className="text-slate-900">
                          {variantDetails.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <h2 className="text-base font-semibold text-slate-900">
                      {text.productImages}
                    </h2>
                    {images.length === 0 ? (
                      <p className="mt-3 text-sm text-slate-500">
                        {text.noImagesAvailable}
                      </p>
                    ) : (
                      <div className="mt-3 space-y-3">
                        <img
                          src={selectedImage ?? images[0]}
                          alt={product.name ?? text.productName}
                          className="h-64 w-full rounded-lg object-contain bg-slate-50"
                        />
                        {images.length > 1 ? (
                          <div className="flex flex-wrap gap-2">
                            {images.map((image) => (
                              <button
                                key={image}
                                type="button"
                                onClick={() => setSelectedImage(image)}
                                className={`rounded-md border px-1 py-1 transition ${
                                  selectedImage === image
                                    ? "border-slate-900"
                                    : "border-slate-200 hover:border-slate-400"
                                }`}
                              >
                                <img
                                  src={image}
                                  alt={product.name ?? text.productName}
                                  className="h-16 w-16 rounded-md object-contain bg-slate-50"
                                />
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <h2 className="text-base font-semibold text-slate-900">
                      {text.productDescription}
                    </h2>
                    <p className="mt-3 text-sm text-slate-600">
                      {product.description ?? text.noDescription}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-base font-semibold text-slate-900">
                  {text.purchaseHistory}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {text.purchaseHistorySubtitle}
                </p>
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-[720px] w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-4 py-3 font-semibold">{text.purchaseId}</th>
                        <th className="px-4 py-3 font-semibold">{text.supplier}</th>
                        <th className="px-4 py-3 font-semibold">{text.quantity}</th>
                        <th className="px-4 py-3 font-semibold">{text.unitCost}</th>
                        <th className="px-4 py-3 font-semibold">{text.arrivalDate}</th>
                        <th className="px-4 py-3 font-semibold">{text.status}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {productPurchaseHistory.length > 0 ? (
                        productPurchaseHistory.map((entry) => (
                          <tr key={entry.purchaseId} className="text-slate-700">
                            <td className="px-4 py-3">{entry.purchaseId}</td>
                            <td className="px-4 py-3">{entry.supplierName}</td>
                            <td className="px-4 py-3">{entry.quantity}</td>
                            <td className="px-4 py-3">{formatCurrency(entry.unitCost)}</td>
                            <td className="px-4 py-3">{entry.expectedArrivalDate || "-"}</td>
                            <td className="px-4 py-3">
                              <PurchaseStatusBadge status={entry.status} />
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="px-4 py-6 text-sm text-slate-500" colSpan={6}>
                            {text.noPurchaseHistory}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        title={text.editProductTitle}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              {text.productName}
            </label>
            <input
              value={nameInput}
              onChange={(event) => setNameInput(event.target.value)}
              placeholder={text.enterProductName}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {text.priceBefore}
              </label>
              <input
                type="number"
                value={priceBeforeInput}
                onChange={(event) => setPriceBeforeInput(event.target.value)}
                placeholder="0.00"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {text.priceAfter}
              </label>
              <input
                type="number"
                value={priceAfterInput}
                onChange={(event) => setPriceAfterInput(event.target.value)}
                placeholder="0.00"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">{text.stock}</label>
              <input
                type="number"
                value={stockInput}
                onChange={(event) => setStockInput(event.target.value)}
                placeholder="0"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {text.category}
              </label>
              <select
                value={categoryIdInput}
                onChange={(event) => setCategoryIdInput(event.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="">{text.selectCategory}</option>
                {categories.map((category) => (
                  <option key={category.id} value={String(category.id)}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {text.variant}
              </label>
              <select
                value={variantIdInput}
                onChange={(event) => setVariantIdInput(event.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="">{text.selectVariant}</option>
                {variants.map((variant) => (
                  <option key={variant.id} value={String(variant.id)}>
                    {variant.sku || variant.name || `Variant #${variant.id}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">{text.status}</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    name="status-edit"
                    value="active"
                    checked={statusInput === "active"}
                    onChange={(event) => setStatusInput(event.target.value)}
                    className="h-4 w-4 accent-slate-900"
                  />
                  {text.active}
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    name="status-edit"
                    value="inactive"
                    checked={statusInput === "inactive"}
                    onChange={(event) => setStatusInput(event.target.value)}
                    className="h-4 w-4 accent-slate-900"
                  />
                  {text.inactive}
                </label>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              {text.description}
            </label>
            <textarea
              value={descriptionInput}
              onChange={(event) => setDescriptionInput(event.target.value)}
              placeholder={text.optionalDescription}
              className="min-h-[96px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              {text.productImages}
            </label>
            <div className="space-y-3">
              {existingEditImages.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {existingEditImages.map((url, index) => (
                    <div
                      key={`existing-${index}`}
                      className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1"
                    >
                      <img
                        src={resolveImageUrl(url)}
                        alt={text.existingImage(index + 1)}
                        className="h-8 w-8 rounded object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setExistingEditImages((prev) =>
                            prev.filter((_, idx) => idx !== index)
                          );
                          setImagesTouched(true);
                        }}
                        className="text-xs text-rose-600 hover:text-rose-800"
                      >
                        {text.remove}
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
              {editImageInputs.map((file, index) => (
                <div key={`edit-image-${index}`} className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">
                    {text.productImage(existingEditImages.length + index + 1)}
                  </label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={(event) => {
                      const nextFile = event.target.files?.[0] ?? null;
                      setEditImageInputs((prev) =>
                        prev.map((item, idx) =>
                          idx === index ? nextFile : item
                        )
                      );
                      if (nextFile) {
                        setImagesTouched(true);
                      }
                    }}
                    className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
                  />
                  {file ? (
                    <p className="text-xs text-slate-500">{file.name}</p>
                  ) : null}
                </div>
              ))}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setEditImageInputs((prev) =>
                      prev.length + existingEditImages.length < 5
                        ? [...prev, null]
                        : prev
                    )
                  }
                  disabled={
                    existingEditImages.length + editImageInputs.length >= 5 ||
                    (editImageInputs.length > 0 &&
                      !editImageInputs[editImageInputs.length - 1])
                  }
                  className="rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {text.addNewImage}
                </button>
                {existingEditImages.length + editImageInputs.length >= 5 ? (
                  <span className="text-xs text-slate-500">
                    {text.maxImages}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          {actionError ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {actionError}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setIsEditOpen(false)}
              disabled={isSubmitting}
            >
              {text.cancel}
            </Button>
            <Button onClick={handleEdit} disabled={isSubmitting}>
              {isSubmitting ? text.updating : text.update}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        title={text.deleteProductTitle}
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            {text.deleteConfirm}
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteOpen(false)}
              disabled={isSubmitting}
            >
              {text.cancel}
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
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
