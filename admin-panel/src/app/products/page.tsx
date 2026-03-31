"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AdminLayout from "@/components/layout/AdminLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { extractList } from "@/lib/extractList";
import api from "@/services/api";
import { useLocalization } from "@/modules/localization/LocalizationProvider";
import BilingualControlledField from "@/modules/shared/components/BilingualControlledField";
import LocalizedDisplayText from "@/modules/shared/components/LocalizedDisplayText";
import { getLocalizedValue } from "@/modules/localization/utils";

type Product = {
  id: number;
  name: string;
  nameEn?: string | null;
  nameAr?: string | null;
  price?: number | string | null;
  priceBeforeDiscount?: number | string | null;
  priceAfterDiscount?: number | string | null;
  stock?: number | string | null;
  status?: string | null;
  isActive?: boolean | null;
  createdAt?: string | null;
  categoryId?: number | null;
  category?: { id?: number | null; name?: string | null } | null;
  variantId?: number | null;
  variant?: { id?: number | null; sku?: string | null; name?: string | null } | null;
  description?: string | null;
  images?: string[] | null;
  image?: string | null;
  imageUrl?: string | null;
  image_url?: string | null;
  imageUrls?: string[] | null;
  imagesUrl?: string[] | null;
  images_url?: string[] | null;
};

type Category = {
  id: number;
  name: string;
  nameEn?: string | null;
  nameAr?: string | null;
};

type Variant = {
  id: number;
  sku?: string | null;
  name?: string | null;
};

type ApiListResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

const formatCurrency = (value: number) =>
  `${new Intl.NumberFormat("en-EG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)} EGP`;

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

const toNumber = (value: string) => {
  if (value.trim() === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

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

const normalizeProduct = (product: unknown): Product => {
  const record = (product && typeof product === "object"
    ? product
    : {}) as Product;
  return ({
    ...record,
    priceBeforeDiscount: toNumberValue(record.priceBeforeDiscount),
    priceAfterDiscount: toNumberValue(record.priceAfterDiscount),
    price: toNumberValue(record.price),
    variantId:
      toNumberValue(record.variantId) ??
      toNumberValue(record.variant?.id) ??
      null,
  });
};

const extractImageValue = (images: unknown) => {
  if (Array.isArray(images)) {
    for (const item of images) {
      if (typeof item === "string" && item) {
        return item;
      }
      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        const candidate =
          (record.url as string) ||
          (record.imageUrl as string) ||
          (record.image_url as string) ||
          (record.path as string) ||
          (record.image as string);
        if (candidate) {
          return candidate;
        }
      }
    }
    return "";
  }
  if (typeof images === "string" && images) {
    if (images.trim().startsWith("[")) {
      try {
        const parsed = JSON.parse(images);
        return extractImageValue(parsed);
      } catch {
        return images;
      }
    }
    return images;
  }
  if (images && typeof images === "object") {
    const record = images as Record<string, unknown>;
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
};

const resolveImageUrl = (product: Product) => {
  const raw =
    extractImageValue(product.images) ||
    extractImageValue(product.imageUrls) ||
    extractImageValue(product.imagesUrl) ||
    extractImageValue(product.images_url) ||
    product.imageUrl ||
    product.image_url ||
    product.image ||
    "";
  if (!raw || typeof raw !== "string") {
    return "";
  }
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  return `${base.replace(/\/$/, "")}/${raw.replace(/^\//, "")}`;
};

const getErrorMessage = (error: unknown) => {
  if (typeof error === "object" && error !== null) {
    const anyError = error as { response?: { data?: { message?: string } } };
    return anyError.response?.data?.message ?? "Something went wrong.";
  }
  return "Something went wrong.";
};

function ProductsPageContent() {
  const { direction, language } = useLocalization();
  const searchParams = useSearchParams();
  const editParam = searchParams.get("edit");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [error, setError] = useState("");
  const [stockEdits, setStockEdits] = useState<Record<number, string>>({});
  const [stockSaving, setStockSaving] = useState<Record<number, boolean>>({});
  const [stockErrors, setStockErrors] = useState<Record<number, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);
  const [nameFilter, setNameFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [productIdFilter, setProductIdFilter] = useState("");
  const [priceBeforeMin, setPriceBeforeMin] = useState("");
  const [priceBeforeMax, setPriceBeforeMax] = useState("");
  const [priceAfterMin, setPriceAfterMin] = useState("");
  const [priceAfterMax, setPriceAfterMax] = useState("");
  const [pendingEditId, setPendingEditId] = useState<string | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [nameEnInput, setNameEnInput] = useState("");
  const [nameArInput, setNameArInput] = useState("");
  const [priceBeforeInput, setPriceBeforeInput] = useState("");
  const [priceAfterInput, setPriceAfterInput] = useState("");
  const [stockInput, setStockInput] = useState("");
  const [statusInput, setStatusInput] = useState("active");
  const [categoryIdInput, setCategoryIdInput] = useState("");
  const [variantIdInput, setVariantIdInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [imageInputs, setImageInputs] = useState<Array<File | null>>([null]);
  const [editImageInputs, setEditImageInputs] = useState<Array<File | null>>([]);
  const [existingEditImages, setExistingEditImages] = useState<string[]>([]);
  const [imagesTouched, setImagesTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const text = {
    outOfStock:
      language === "ar"
        ? "لديك منتج نفد من المخزون، يرجى اتخاذ إجراء:"
        : "You have an out-of-stock product. Please take action:",
    products: language === "ar" ? "المنتجات" : "Products",
    manage:
      language === "ar"
        ? "إدارة قائمة المنتجات والمخزون."
        : "Manage product listings and inventory.",
    add: language === "ar" ? "إضافة منتج" : "Add Product",
    productName: language === "ar" ? "اسم المنتج" : "Product Name",
    category: language === "ar" ? "الفئة" : "Category",
    productId: language === "ar" ? "معرف المنتج" : "Product ID",
    priceBeforeMin:
      language === "ar" ? "الحد الأدنى قبل الخصم" : "Price Before Min",
    priceBeforeMax:
      language === "ar" ? "الحد الأقصى قبل الخصم" : "Price Before Max",
    priceAfterMin:
      language === "ar" ? "الحد الأدنى بعد الخصم" : "Price After Min",
    priceAfterMax:
      language === "ar" ? "الحد الأقصى بعد الخصم" : "Price After Max",
    min: language === "ar" ? "الحد الأدنى" : "Min",
    max: language === "ar" ? "الحد الأقصى" : "Max",
    apply: language === "ar" ? "تطبيق الفلاتر" : "Apply Filters",
    clear: language === "ar" ? "مسح الفلاتر" : "Clear Filters",
    noProducts: language === "ar" ? "لا توجد منتجات." : "No products found.",
    loading: language === "ar" ? "جارٍ التحميل..." : "Loading...",
    image: language === "ar" ? "الصورة" : "Image",
    variant: language === "ar" ? "المتغير" : "Variant",
    priceBefore:
      language === "ar" ? "السعر قبل الخصم" : "Price Before Discount",
    priceAfter:
      language === "ar" ? "السعر بعد الخصم" : "Price After Discount",
    stock: language === "ar" ? "المخزون" : "Stock",
    createdAt: language === "ar" ? "تاريخ الإنشاء" : "Created At",
    view: language === "ar" ? "عرض" : "View",
    actions: language === "ar" ? "الإجراءات" : "Actions",
    noImage: language === "ar" ? "لا توجد صورة" : "No image",
    edit: language === "ar" ? "تعديل" : "Edit",
    delete: language === "ar" ? "حذف" : "Delete",
    save: language === "ar" ? "حفظ" : "Save",
    update: language === "ar" ? "تحديث" : "Update",
    cancel: language === "ar" ? "إلغاء" : "Cancel",
    addProduct: language === "ar" ? "إضافة منتج" : "Add Product",
    editProduct: language === "ar" ? "تعديل المنتج" : "Edit Product",
    deleteProduct: language === "ar" ? "حذف المنتج" : "Delete Product",
    productNameEn:
      language === "ar" ? "اسم المنتج (الإنجليزية)" : "Product Name (English)",
    productNameAr:
      language === "ar" ? "اسم المنتج (العربية)" : "Product Name (Arabic)",
    stockLabel: language === "ar" ? "المخزون" : "Stock",
    categoryName: language === "ar" ? "اسم الفئة" : "Category Name",
    variantId: language === "ar" ? "المتغير" : "Variant ID",
    status: language === "ar" ? "الحالة" : "Status",
    active: language === "ar" ? "نشط" : "Active",
    notActive: language === "ar" ? "غير نشط" : "Not Active",
    description: language === "ar" ? "الوصف" : "Description",
    optionalDescription:
      language === "ar" ? "وصف اختياري" : "Optional description",
    productImages: language === "ar" ? "صور المنتج" : "Product Images",
    addImage: language === "ar" ? "إضافة صورة جديدة" : "Add New Image",
  };

  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => a.id - b.id),
    [products]
  );
  const outOfStockProducts = useMemo(
    () =>
      sortedProducts.filter((product) => {
        const stockValue = toNumberValue(product.stock);
        return stockValue !== null && stockValue <= 0;
      }),
    [sortedProducts]
  );

  const fetchProducts = async (
    page: number,
    initial = false,
    overrides?: Partial<{
      nameFilter: string;
      categoryFilter: string;
      productIdFilter: string;
      priceBeforeMin: string;
      priceBeforeMax: string;
      priceAfterMin: string;
      priceAfterMax: string;
    }>
  ) => {
    if (initial) {
      setIsLoading(true);
    } else {
      setIsPageLoading(true);
    }
    setError("");
    try {
      const params = new URLSearchParams();
      const safePage = Math.max(1, page);
      params.set("page", String(safePage));
      params.set("limit", String(limit));
      const resolvedName = overrides?.nameFilter ?? nameFilter;
      const resolvedCategory = overrides?.categoryFilter ?? categoryFilter;
      const resolvedProductId = overrides?.productIdFilter ?? productIdFilter;
      const resolvedPriceBeforeMin =
        overrides?.priceBeforeMin ?? priceBeforeMin;
      const resolvedPriceBeforeMax =
        overrides?.priceBeforeMax ?? priceBeforeMax;
      const resolvedPriceAfterMin =
        overrides?.priceAfterMin ?? priceAfterMin;
      const resolvedPriceAfterMax =
        overrides?.priceAfterMax ?? priceAfterMax;

      if (resolvedName.trim()) {
        params.set("name", resolvedName.trim());
      }
      if (resolvedCategory) {
        params.set("categoryId", resolvedCategory);
      }
      if (resolvedProductId.trim()) {
        params.set("productId", resolvedProductId.trim());
      }
      if (resolvedPriceBeforeMin.trim()) {
        params.set("priceBeforeMin", resolvedPriceBeforeMin.trim());
      }
      if (resolvedPriceBeforeMax.trim()) {
        params.set("priceBeforeMax", resolvedPriceBeforeMax.trim());
      }
      if (resolvedPriceAfterMin.trim()) {
        params.set("priceAfterMin", resolvedPriceAfterMin.trim());
      }
      if (resolvedPriceAfterMax.trim()) {
        params.set("priceAfterMax", resolvedPriceAfterMax.trim());
      }
      const query = params.toString();
      const response = await api.get<ApiListResponse<unknown>>(
        `/products${query ? `?${query}` : ""}`
      );
      const payload = response.data?.data ?? response.data ?? {};
      const normalized = extractList<unknown>(payload).map(normalizeProduct);
      setProducts(normalized);
      setStockEdits(
        normalized.reduce<Record<number, string>>((acc, product) => {
          acc[product.id] =
            product.stock !== null && product.stock !== undefined
              ? String(product.stock)
              : "";
          return acc;
        }, {})
      );
      const record = payload as Record<string, unknown>;
      const pagination =
        (record.pagination as Record<string, unknown> | undefined) ??
        (record.meta as Record<string, unknown> | undefined) ??
        null;
      const nextCurrent =
        toNumberValue(pagination?.currentPage ?? pagination?.page) ?? safePage;
      const nextTotalItems =
        toNumberValue(pagination?.totalItems ?? pagination?.count) ??
        normalized.length;
      const nextTotalPages =
        toNumberValue(pagination?.totalPages ?? pagination?.pages) ??
        Math.max(1, Math.ceil(nextTotalItems / limit));
      setCurrentPage(nextCurrent);
      setTotalPages(nextTotalPages);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
      setIsPageLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get<ApiListResponse<Category[]>>(
        "/categories"
      );
      setCategories(extractList<Category>(response.data?.data ?? response.data));
    } catch {
      setCategories([]);
    }
  };

  const fetchVariants = async () => {
    try {
      const response = await api.get<ApiListResponse<Variant[]>>(
        "/variants"
      );
      setVariants(extractList<Variant>(response.data?.data ?? response.data));
    } catch {
      setVariants([]);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchVariants();
  }, []);

  useEffect(() => {
    if (editParam) {
      setProductIdFilter(editParam);
      setCurrentPage(1);
      setPendingEditId(editParam);
      fetchProducts(1, true, { productIdFilter: editParam });
      return;
    }
    fetchProducts(1, true);
  }, [editParam]);

  useEffect(() => {
    if (!pendingEditId || isLoading) {
      return;
    }
    const match = products.find(
      (product) => String(product.id) === String(pendingEditId)
    );
    if (match) {
      openEditModal(match);
      setPendingEditId(null);
      return;
    }
    if (!isPageLoading) {
      setPendingEditId(null);
    }
  }, [pendingEditId, products, isLoading, isPageLoading]);

  const resetForm = () => {
    setNameEnInput("");
    setNameArInput("");
    setPriceBeforeInput("");
    setPriceAfterInput("");
    setStockInput("");
    setStatusInput("active");
    setCategoryIdInput("");
    setVariantIdInput("");
    setDescriptionInput("");
    setActionError("");
    setSuccessMessage("");
    setImageInputs([null]);
    setEditImageInputs([]);
    setExistingEditImages([]);
    setImagesTouched(false);
  };

  const openAddModal = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setNameEnInput(product.nameEn ?? product.name ?? "");
    setNameArInput(product.nameAr ?? "");
    setPriceBeforeInput(product.priceBeforeDiscount?.toString() ?? "");
    setPriceAfterInput(product.priceAfterDiscount?.toString() ?? "");
    setStockInput(product.stock?.toString() ?? "");
    const isActive =
      typeof product.isActive === "boolean"
        ? product.isActive
        : product.status?.toLowerCase() === "active";
    setStatusInput(isActive ? "active" : "inactive");
    setCategoryIdInput(product.categoryId?.toString() ?? "");
    const resolvedVariantId =
      product.variantId ??
      product.variant?.id ??
      (typeof product.variant === "object"
        ? product.variant?.id ?? null
        : null);
    setVariantIdInput(
      typeof resolvedVariantId === "number" ? String(resolvedVariantId) : ""
    );
    setDescriptionInput(product.description ?? "");
    setActionError("");
    setSuccessMessage("");
    setEditImageInputs([null]);
    setExistingEditImages(
      Array.isArray(product.images) ? product.images.filter(Boolean) : []
    );
    setImagesTouched(false);
    setIsEditOpen(true);
  };

  const openDeleteModal = (product: Product) => {
    setSelectedProduct(product);
    setActionError("");
    setIsDeleteOpen(true);
  };

  const resolveVariantId = () => {
    const direct = toNumber(variantIdInput);
    if (direct !== null) {
      return direct;
    }
    const match = variants.find(
      (variant) =>
        variant.sku === variantIdInput || variant.name === variantIdInput
    );
    const fallback = match?.id;
    return typeof fallback === "number" ? fallback : null;
  };

  const buildPayload = () => {
    const normalizedNameEn = nameEnInput.trim();
    const normalizedNameAr = nameArInput.trim();
    const payload: Record<string, unknown> = {
      name: normalizedNameEn,
      nameEn: normalizedNameEn,
      nameAr: normalizedNameAr || null,
    };
    const priceBefore = toNumber(priceBeforeInput);
    const priceAfter = toNumber(priceAfterInput);
    const stock = toNumber(stockInput);
    const categoryId = toNumber(categoryIdInput);
    const variantId = resolveVariantId();
    if (priceBefore !== null) {
      payload.priceBeforeDiscount = priceBefore;
    }
    if (priceAfter !== null) {
      payload.priceAfterDiscount = priceAfter;
    }
    if (stock !== null) {
      payload.stock = stock;
    }
    if (categoryId !== null) {
      payload.categoryId = categoryId;
    }
    if (variantId !== null) {
      payload.variantId = variantId;
    }
    if (statusInput.trim()) {
      payload.isActive = statusInput.trim().toLowerCase() === "active";
    }
    payload.description = descriptionInput.trim();

    return payload;
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

  const handleAdd = async () => {
    setIsSubmitting(true);
    setActionError("");
    try {
      if (resolveVariantId() === null) {
        setActionError("Variant is required.");
        return;
      }
      const filesToUpload = imageInputs.filter(
        (file): file is File => file instanceof File
      );
      if (filesToUpload.length === 0) {
        setActionError("Product images are required.");
        return;
      }
      const imageUrls = await uploadImages(filesToUpload);
      if (imageUrls.length === 0) {
        setActionError("Image upload failed.");
        return;
      }
      await api.post("/products", {
        ...buildPayload(),
        images: imageUrls,
      });
      setSuccessMessage("Product created successfully.");
      setIsAddOpen(false);
      await fetchProducts(currentPage, true);
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedProduct) {
      return;
    }
    setIsSubmitting(true);
    setActionError("");
    const payload: Record<string, unknown> = {};
    try {
      const filesToUpload = editImageInputs.filter(
        (file): file is File => file instanceof File
      );
      let uploadedUrls: string[] = [];
      if (filesToUpload.length > 0) {
        uploadedUrls = await uploadImages(filesToUpload);
        if (uploadedUrls.length === 0) {
          setActionError("Image upload failed.");
          return;
        }
      }
      const nextName = nameEnInput.trim();
      if (nextName && nextName !== (selectedProduct.nameEn ?? selectedProduct.name)) {
        payload.name = nextName;
        payload.nameEn = nextName;
      }
      const nextNameAr = nameArInput.trim() || null;
      if (nextNameAr !== (selectedProduct.nameAr ?? null)) {
        payload.nameAr = nextNameAr;
      }
      const nextPriceBefore = toNumber(priceBeforeInput);
      if (
        nextPriceBefore !== null &&
        nextPriceBefore !== toNumberValue(selectedProduct.priceBeforeDiscount)
      ) {
        payload.priceBeforeDiscount = nextPriceBefore;
      }
      const nextPriceAfter = toNumber(priceAfterInput);
      if (
        nextPriceAfter !== null &&
        nextPriceAfter !== toNumberValue(selectedProduct.priceAfterDiscount)
      ) {
        payload.priceAfterDiscount = nextPriceAfter;
      }
      const nextStock = toNumber(stockInput);
      if (
        nextStock !== null &&
        nextStock !== toNumberValue(selectedProduct.stock)
      ) {
        payload.stock = nextStock;
      }
      const nextCategoryId = toNumber(categoryIdInput);
      if (
        nextCategoryId !== null &&
        nextCategoryId !== selectedProduct.categoryId
      ) {
        payload.categoryId = nextCategoryId;
      }
      const nextVariantId = resolveVariantId();
      if (
        nextVariantId !== null &&
        nextVariantId !== selectedProduct.variantId
      ) {
        payload.variantId = nextVariantId;
      }
      const nextDescription = descriptionInput.trim();
      if (nextDescription !== (selectedProduct.description ?? "")) {
        payload.description = nextDescription;
      }
      const selectedIsActive =
        typeof selectedProduct.isActive === "boolean"
          ? selectedProduct.isActive
          : selectedProduct.status?.toLowerCase() === "active";
      const nextIsActive = statusInput.trim().toLowerCase() === "active";
      if (nextIsActive !== selectedIsActive) {
        payload.isActive = nextIsActive;
      }
      if (imagesTouched) {
        payload.images = [...existingEditImages, ...uploadedUrls];
      }
      if (Object.keys(payload).length === 0) {
        setActionError("No changes to update.");
        return;
      }
      await api.put(`/products/${selectedProduct.id}`, payload);
      setIsEditOpen(false);
      setSelectedProduct(null);
      await fetchProducts(currentPage, true);
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) {
      return;
    }
    setIsSubmitting(true);
    setActionError("");
    try {
      await api.delete(`/products/${selectedProduct.id}`);
      setIsDeleteOpen(false);
      setSelectedProduct(null);
      await fetchProducts(currentPage, true);
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStockSave = async (product: Product) => {
    setStockErrors((prev) => ({ ...prev, [product.id]: "" }));
    const nextStock = toNumber(stockEdits[product.id] ?? "");
    if (nextStock === null) {
      setStockErrors((prev) => ({
        ...prev,
        [product.id]: "Stock is required.",
      }));
      return;
    }
    setStockSaving((prev) => ({ ...prev, [product.id]: true }));
    try {
      await api.put(`/products/${product.id}`, { stock: nextStock });
      setProducts((prev) =>
        prev.map((item) =>
          item.id === product.id ? { ...item, stock: nextStock } : item
        )
      );
    } catch (err) {
      setStockErrors((prev) => ({
        ...prev,
        [product.id]: getErrorMessage(err),
      }));
    } finally {
      setStockSaving((prev) => ({ ...prev, [product.id]: false }));
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6" dir={direction}>
        {outOfStockProducts.length > 0 ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
            {text.outOfStock}
            <span className="ml-2 flex flex-wrap gap-2">
              {outOfStockProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/admin/products/${product.id}`}
                  className="text-amber-800 underline decoration-amber-400 hover:text-amber-900"
                >
                  {getLocalizedValue({
                    en: product.nameEn,
                    ar: product.nameAr,
                    legacy: product.name ?? `Product #${product.id}`,
                    lang: language,
                  })}
                </Link>
              ))}
            </span>
          </div>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{text.products}</h1>
            <p className="text-sm text-slate-500">
              {text.manage}
            </p>
          </div>
          <Button onClick={openAddModal}>{text.add}</Button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {text.productName}
              </label>
              <input
                value={nameFilter}
                onChange={(event) => setNameFilter(event.target.value)}
                placeholder={text.productName}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {text.category}
              </label>
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="">All</option>
                {categories.map((category) => (
                  <option key={category.id} value={String(category.id)}>
                    {getLocalizedValue({
                      en: category.nameEn,
                      ar: category.nameAr,
                      legacy: category.name,
                      lang: language,
                    })}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {text.productId}
              </label>
              <input
                type="number"
                value={productIdFilter}
                onChange={(event) => setProductIdFilter(event.target.value)}
                placeholder={text.productId}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {text.priceBeforeMin}
              </label>
              <input
                type="number"
                value={priceBeforeMin}
                onChange={(event) => setPriceBeforeMin(event.target.value)}
                placeholder={text.min}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {text.priceBeforeMax}
              </label>
              <input
                type="number"
                value={priceBeforeMax}
                onChange={(event) => setPriceBeforeMax(event.target.value)}
                placeholder={text.max}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {text.priceAfterMin}
              </label>
              <input
                type="number"
                value={priceAfterMin}
                onChange={(event) => setPriceAfterMin(event.target.value)}
                placeholder={text.min}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {text.priceAfterMax}
              </label>
              <input
                type="number"
                value={priceAfterMax}
                onChange={(event) => setPriceAfterMax(event.target.value)}
                placeholder={text.max}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setCurrentPage(1);
                fetchProducts(1);
              }}
              disabled={isPageLoading}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {text.apply}
            </button>
            <button
              type="button"
              onClick={() => {
                setNameFilter("");
                setCategoryFilter("");
                setProductIdFilter("");
                setPriceBeforeMin("");
                setPriceBeforeMax("");
                setPriceAfterMin("");
                setPriceAfterMax("");
                setCurrentPage(1);
                fetchProducts(1);
              }}
              disabled={isPageLoading}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {text.clear}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-8 w-full animate-pulse rounded bg-slate-200" />
              <div className="h-8 w-full animate-pulse rounded bg-slate-200" />
              <div className="h-8 w-full animate-pulse rounded bg-slate-200" />
            </div>
          ) : error ? (
            <p className="text-sm text-rose-600">{error}</p>
          ) : sortedProducts.length === 0 ? (
            <p className="text-sm text-slate-500">{text.noProducts}</p>
          ) : (
            <div className="overflow-x-auto">
              {isPageLoading ? (
                <div className="mb-3 text-xs text-slate-500">{text.loading}</div>
              ) : null}
              <table className={`w-full text-sm ${direction === "rtl" ? "text-right" : "text-left"}`}>
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="py-2 pr-4 font-medium">ID</th>
                    <th className="py-2 pr-4 font-medium">{text.image}</th>
                    <th className="py-2 pr-4 font-medium">{text.productName}</th>
                    <th className="py-2 pr-4 font-medium">{text.category}</th>
                    <th className="py-2 pr-4 font-medium">{text.variant}</th>
                    <th className="py-2 pr-4 font-medium">
                      {text.priceBefore}
                    </th>
                    <th className="py-2 pr-4 font-medium">
                      {text.priceAfter}
                    </th>
                    <th className="py-2 pr-4 font-medium">{text.stock}</th>
                    <th className="py-2 pr-4 font-medium">{text.createdAt}</th>
                    <th className="py-2 pr-4 font-medium">{text.view}</th>
                    <th className="py-2 font-medium">{text.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sortedProducts.map((product) => (
                    <tr key={product.id} className="text-slate-700">
                      <td className="py-3 pr-4">{product.id}</td>
                      <td className="py-3 pr-4">
                        {resolveImageUrl(product) ? (
                          <img
                            src={resolveImageUrl(product)}
                            alt={product.nameEn ?? product.name}
                            className="h-10 w-10 rounded-md object-cover"
                          />
                        ) : (
                          <span className="text-xs text-slate-400">{text.noImage}</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="text-slate-900 hover:underline"
                        >
                          <LocalizedDisplayText
                            valueEn={product.nameEn}
                            valueAr={product.nameAr}
                            legacyValue={product.name}
                          />
                        </Link>
                      </td>
                      <td className="py-3 pr-4">
                        {getLocalizedValue({
                          en:
                            product.category?.name ??
                            categories.find((category) => category.id === product.categoryId)?.nameEn,
                          ar:
                            categories.find((category) => category.id === product.categoryId)?.nameAr,
                          legacy:
                            product.category?.name ??
                            categories.find((category) => category.id === product.categoryId)?.name ??
                            "-",
                          lang: language,
                        })}
                      </td>
                      <td className="py-3 pr-4">
                        {product.variant?.sku ||
                          product.variant?.name ||
                          variants.find(
                            (variant) => variant.id === product.variantId
                          )?.sku ||
                          variants.find(
                            (variant) => variant.id === product.variantId
                          )?.name ||
                          (product.variantId
                            ? `Variant #${product.variantId}`
                            : "-")}
                      </td>
                      <td className="py-3 pr-4">
                        {product.priceBeforeDiscount !== null &&
                        product.priceBeforeDiscount !== undefined
                          ? formatCurrency(Number(product.priceBeforeDiscount))
                          : product.price !== null && product.price !== undefined
                            ? formatCurrency(Number(product.price))
                            : "-"}
                      </td>
                      <td className="py-3 pr-4">
                        {product.priceAfterDiscount !== null &&
                        product.priceAfterDiscount !== undefined
                          ? formatCurrency(Number(product.priceAfterDiscount))
                          : "-"}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={stockEdits[product.id] ?? ""}
                            onChange={(event) =>
                              setStockEdits((prev) => ({
                                ...prev,
                                [product.id]: event.target.value,
                              }))
                            }
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                handleStockSave(product);
                              }
                            }}
                            className="w-24 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                          />
                          <Button
                            variant="secondary"
                            className="px-3 py-1 text-xs"
                            onClick={() => handleStockSave(product)}
                            disabled={stockSaving[product.id]}
                          >
                            {stockSaving[product.id] ? text.loading : text.update}
                          </Button>
                        </div>
                        {stockErrors[product.id] ? (
                          <p className="mt-1 text-xs text-rose-600">
                            {stockErrors[product.id]}
                          </p>
                        ) : null}
                      </td>
                      <td className="py-3 pr-4">
                        {formatDate(product.createdAt)}
                      </td>
                      <td className="py-3 pr-4">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
                        >
                          {text.view}
                        </Link>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="secondary"
                            onClick={() => openEditModal(product)}
                          >
                            {text.edit}
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() => openDeleteModal(product)}
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

        {totalPages > 1 ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => fetchProducts(currentPage - 1)}
              disabled={currentPage === 1 || isPageLoading}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {language === "ar" ? "السابق" : "Previous"}
            </button>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => fetchProducts(page)}
                    disabled={isPageLoading}
                    className={`rounded-md px-3 py-2 text-sm transition ${
                      page === currentPage
                        ? "bg-slate-900 text-white"
                        : "border border-slate-300 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
            </div>
            <button
              type="button"
              onClick={() => fetchProducts(currentPage + 1)}
              disabled={currentPage === totalPages || isPageLoading}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {language === "ar" ? "التالي" : "Next"}
            </button>
          </div>
        ) : null}

        <Modal title={text.addProduct} isOpen={isAddOpen} onClose={() => setIsAddOpen(false)}>
          <div className="space-y-4">
            <BilingualControlledField
              label={language === "ar" ? "Ø§Ø³Ù… Ø§Ù„Ù…Ù†ØªØ¬" : "Product Name"}
              valueEn={nameEnInput}
              valueAr={nameArInput}
              onChangeEn={setNameEnInput}
              onChangeAr={setNameArInput}
              placeholderEn={text.productName}
              placeholderAr={
                language === "ar" ? "Ø£Ø¯Ø®Ù„ Ø§Ø³Ù… Ø§Ù„Ù…Ù†ØªØ¬ Ø¨Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©" : "Enter Arabic product name"
              }
              requiredEn
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  {text.priceBefore}
                </label>
                <Input
                  type="number"
                  value={priceBeforeInput}
                  onChange={(event) => setPriceBeforeInput(event.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  {text.priceAfter}
                </label>
                <Input
                  type="number"
                  value={priceAfterInput}
                  onChange={(event) => setPriceAfterInput(event.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  {text.stockLabel}
                </label>
                <Input
                  type="number"
                  value={stockInput}
                  onChange={(event) => setStockInput(event.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  {text.categoryName}
                </label>
                <select
                  value={categoryIdInput}
                  onChange={(event) => setCategoryIdInput(event.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                >
                  <option value="">{text.categoryName}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {getLocalizedValue({
                        en: category.nameEn,
                        ar: category.nameAr,
                        legacy: category.name,
                        lang: language,
                      })}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  {text.variantId}
                </label>
                <select
                  value={variantIdInput}
                  onChange={(event) => setVariantIdInput(event.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                >
                  <option value="">{text.variantId}</option>
                  {variants.map((variant) => (
                    <option key={variant.id} value={String(variant.id)}>
                      {variant.sku || variant.name || `Variant #${variant.id}`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  {text.status}
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="radio"
                      name="status-add"
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
                      name="status-add"
                      value="inactive"
                      checked={statusInput === "inactive"}
                      onChange={(event) => setStatusInput(event.target.value)}
                      className="h-4 w-4 accent-slate-900"
                    />
                    {text.notActive}
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
                {imageInputs.map((file, index) => (
                  <div key={`add-image-${index}`} className="space-y-1">
                    <label className="text-xs font-medium text-slate-500">
                      {`Product Image ${index + 1}`}
                    </label>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={(event) =>
                        setImageInputs((prev) =>
                          prev.map((item, idx) =>
                            idx === index ? event.target.files?.[0] ?? null : item
                          )
                        )
                      }
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
                      setImageInputs((prev) =>
                        prev.length < 5 ? [...prev, null] : prev
                      )
                    }
                    disabled={
                      imageInputs.length >= 5 ||
                      !imageInputs[imageInputs.length - 1]
                    }
                    className="rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {text.addImage}
                  </button>
                  {imageInputs.length >= 5 ? (
                    <span className="text-xs text-slate-500">
                      Maximum 5 images allowed
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
            {successMessage ? (
              <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {successMessage}
              </p>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setIsAddOpen(false)}
                disabled={isSubmitting}
              >
                {text.cancel}
              </Button>
              <Button
                onClick={handleAdd}
                disabled={
                  isSubmitting ||
                  nameEnInput.trim().length === 0 ||
                  imageInputs.every((file) => !file)
                }
              >
                {isSubmitting ? text.loading : text.save}
              </Button>
            </div>
          </div>
        </Modal>

        <Modal title={text.editProduct} isOpen={isEditOpen} onClose={() => setIsEditOpen(false)}>
          <div className="space-y-4">
            <BilingualControlledField
              label={language === "ar" ? "Ø§Ø³Ù… Ø§Ù„Ù…Ù†ØªØ¬" : "Product Name"}
              valueEn={nameEnInput}
              valueAr={nameArInput}
              onChangeEn={setNameEnInput}
              onChangeAr={setNameArInput}
              placeholderEn={text.productName}
              placeholderAr={
                language === "ar" ? "Ø£Ø¯Ø®Ù„ Ø§Ø³Ù… Ø§Ù„Ù…Ù†ØªØ¬ Ø¨Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©" : "Enter Arabic product name"
              }
              requiredEn
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  {text.priceBefore}
                </label>
                <Input
                  type="number"
                  value={priceBeforeInput}
                  onChange={(event) => setPriceBeforeInput(event.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  {text.priceAfter}
                </label>
                <Input
                  type="number"
                  value={priceAfterInput}
                  onChange={(event) => setPriceAfterInput(event.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  {text.stockLabel}
                </label>
                <Input
                  type="number"
                  value={stockInput}
                  onChange={(event) => setStockInput(event.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  {text.categoryName}
                </label>
                <select
                  value={categoryIdInput}
                  onChange={(event) => setCategoryIdInput(event.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                >
                  <option value="">{text.categoryName}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {getLocalizedValue({
                        en: category.nameEn,
                        ar: category.nameAr,
                        legacy: category.name,
                        lang: language,
                      })}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  {text.variantId}
                </label>
                <select
                  value={variantIdInput}
                  onChange={(event) => setVariantIdInput(event.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                >
                  <option value="">{text.variantId}</option>
                  {variants.map((variant) => (
                    <option key={variant.id} value={String(variant.id)}>
                      {variant.sku || variant.name || `Variant #${variant.id}`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  {text.status}
                </label>
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
                    {text.notActive}
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
                          src={url}
                          alt={`Existing ${index + 1}`}
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
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
                {editImageInputs.map((file, index) => (
                  <div key={`edit-image-${index}`} className="space-y-1">
                    <label className="text-xs font-medium text-slate-500">
                      {`Product Image ${existingEditImages.length + index + 1}`}
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
                    {text.addImage}
                  </button>
                  {existingEditImages.length + editImageInputs.length >= 5 ? (
                    <span className="text-xs text-slate-500">
                      Maximum 5 images allowed
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
              <Button
                onClick={handleEdit}
                disabled={isSubmitting || nameEnInput.trim().length === 0}
              >
                {isSubmitting ? text.loading : text.update}
              </Button>
            </div>
          </div>
        </Modal>

        <Modal title={text.deleteProduct} isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)}>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              {language === "ar"
                ? "هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء."
                : "Are you sure you want to delete this product? This action cannot be undone."}
            </p>
            {actionError ? (
              <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {actionError}
              </p>
            ) : null}
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
                {isSubmitting ? text.loading : text.delete}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={null}>
      <ProductsPageContent />
    </Suspense>
  );
}
