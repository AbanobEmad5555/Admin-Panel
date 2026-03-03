import api from "@/services/api";
import type {
  AdminReview,
  AdminReviewsFilters,
  AdminReviewsPagination,
  AdminReviewsResponse,
  DeleteReviewPayload,
  ReviewStatus,
  UpdateReviewStatusPayload,
} from "@/features/admin-reviews/api/adminReviews.types";

type UnknownRecord = Record<string, unknown>;

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const PRODUCT_ENRICHMENT_TTL_MS = 5 * 60 * 1000;

type ProductEnrichment = { image?: string; sku?: string };
type ProductEnrichmentCacheEntry = {
  value: ProductEnrichment;
  expiresAt: number;
};

const productEnrichmentCache = new Map<string, ProductEnrichmentCacheEntry>();
const productEnrichmentInFlight = new Map<string, Promise<ProductEnrichment>>();

const unwrap = <T>(value: unknown): T => {
  const envelope = (value ?? {}) as ApiEnvelope<T>;
  if (typeof envelope === "object" && "data" in envelope) {
    return (envelope.data ?? ({} as T)) as T;
  }
  return value as T;
};

const toNumber = (value: unknown, fallback = 0) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
};

const toStringSafe = (value: unknown, fallback = "") => {
  if (value === null || value === undefined) {
    return fallback;
  }
  return String(value);
};

const toReviewStatus = (value: unknown): ReviewStatus => {
  const normalized = toStringSafe(value, "PENDING").toUpperCase();
  if (normalized === "PENDING" || normalized === "APPROVED" || normalized === "HIDDEN") {
    return normalized;
  }
  return "PENDING";
};

const resolveImageUrl = (value: unknown): string => {
  const raw = toStringSafe(value).trim();
  if (!raw) {
    return "";
  }

  const normalizedPath = raw.replace(/\\/g, "/");

  if (normalizedPath.startsWith("http://") || normalizedPath.startsWith("https://")) {
    return normalizedPath;
  }

  const base = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/$/, "");
  return `${base}/${normalizedPath.replace(/^\//, "")}`;
};

const resolveFirstAssetUrl = (value: unknown): string => {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return "";
    }

    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        const fromParsed = resolveFirstAssetUrl(parsed);
        if (fromParsed) {
          return fromParsed;
        }
      } catch {
        // fall through to raw string URL resolution
      }
    }

    return resolveImageUrl(trimmed);
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = resolveFirstAssetUrl(item);
      if (found) {
        return found;
      }
    }
    return "";
  }

  if (typeof value === "object") {
    const record = value as UnknownRecord;
    return (
      resolveFirstAssetUrl(record.url) ||
      resolveFirstAssetUrl(record.imageUrl) ||
      resolveFirstAssetUrl(record.image_url) ||
      resolveFirstAssetUrl(record.path) ||
      resolveFirstAssetUrl(record.image) ||
      resolveFirstAssetUrl(record.src) ||
      resolveFirstAssetUrl(record.secure_url) ||
      ""
    );
  }

  return "";
};

const firstNonEmptyString = (...values: unknown[]) => {
  for (const value of values) {
    const next = toStringSafe(value).trim();
    if (next) {
      return next;
    }
  }
  return "";
};

const firstMeaningfulString = (...values: unknown[]) => {
  for (const value of values) {
    const next = toStringSafe(value).trim();
    if (!next) {
      continue;
    }

    const normalized = next.toLowerCase();
    if (
      normalized === "0" ||
      normalized === "null" ||
      normalized === "undefined" ||
      normalized === "n/a" ||
      normalized === "na" ||
      normalized === "-"
    ) {
      continue;
    }

    return next;
  }
  return "";
};

const asRecord = (value: unknown): UnknownRecord =>
  value && typeof value === "object" ? (value as UnknownRecord) : {};

const collectVariantTextCandidates = (value: unknown): string[] => {
  if (value === null || value === undefined) {
    return [];
  }

  if (typeof value === "string" || typeof value === "number") {
    return [String(value)];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectVariantTextCandidates(item));
  }

  if (typeof value === "object") {
    const record = value as UnknownRecord;
    return [
      toStringSafe(record.sku),
      toStringSafe(record.SKU),
      toStringSafe(record.code),
      toStringSafe(record.variantCode),
      toStringSafe(record.variant_code),
      toStringSafe(record.value),
      toStringSafe(record.variantValue),
      toStringSafe(record.variant_value),
      toStringSafe(record.label),
      toStringSafe(record.name),
      toStringSafe(record.title),
      ...collectVariantTextCandidates(record.option),
      ...collectVariantTextCandidates(record.optionValue),
      ...collectVariantTextCandidates(record.option_value),
      ...collectVariantTextCandidates(record.variant),
    ];
  }

  return [];
};

const normalizeMediaItem = (value: unknown): AdminReview["media"][number] | null => {
  const record = (value ?? {}) as UnknownRecord;
  const url = resolveImageUrl(record.url ?? record.path ?? record.image ?? record.video);
  if (!url) {
    return null;
  }

  const rawType = toStringSafe(record.type, "IMAGE").toUpperCase();
  return {
    url,
    type: rawType === "VIDEO" ? "VIDEO" : "IMAGE",
  };
};

const normalizeReview = (value: unknown): AdminReview => {
  const record = (value ?? {}) as UnknownRecord;
  const user = (record.user ?? record.customer ?? {}) as UnknownRecord;
  const product = (record.product ?? {}) as UnknownRecord;
  const rawVariantCandidates = [
    product.variant,
    product.productVariant,
    product.selectedVariant,
    product.variantValue,
    product.variant_value,
    product.variantName,
    product.variant_name,
    product.variantLabel,
    product.variant_label,
    record.variant,
    record.productVariant,
    record.selectedVariant,
    record.variantValue,
    record.variant_value,
    record.variantName,
    record.variant_name,
    record.variantLabel,
    record.variant_label,
    Array.isArray(product.variants) ? product.variants[0] : null,
    Array.isArray(product.productVariants) ? product.productVariants[0] : null,
    Array.isArray(record.variants) ? record.variants[0] : null,
    Array.isArray(record.productVariants) ? record.productVariants[0] : null,
  ];
  const variantCandidates = rawVariantCandidates.map(asRecord);
  const [primaryVariant] = variantCandidates;
  const fullName = toStringSafe(user.name).trim();
  const [firstFromName = "", ...lastParts] = fullName ? fullName.split(/\s+/) : [];
  const lastFromName = lastParts.join(" ");
  const mediaRaw = Array.isArray(record.media)
    ? record.media
    : Array.isArray(record.images)
      ? record.images
      : [];
  const normalizedMedia = mediaRaw
    .map(normalizeMediaItem)
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const variantTextCandidates = rawVariantCandidates.flatMap((candidate) =>
    collectVariantTextCandidates(candidate),
  );
  const resolvedSku =
    firstMeaningfulString(
      product.sku,
      product.SKU,
      product.variantSku,
      product.variant_sku,
      ...variantTextCandidates,
      ...variantCandidates.flatMap((candidate) => [
        candidate.sku,
        candidate.SKU,
        candidate.code,
        candidate.variantCode,
        candidate.variant_code,
        candidate.name,
        candidate.title,
      ]),
      product.variantName,
      product.variant_name,
      product.variantCode,
      product.variant_code,
      product.variantLabel,
      product.variant_label,
      record.sku,
      record.SKU,
    ) || "N/A";
  const resolvedProductImage =
    resolveFirstAssetUrl(
      product.image ??
        product.imageUrl ??
        product.image_url ??
        product.thumbnail ??
        product.thumbnailUrl ??
        product.images ??
        product.imageUrls ??
        product.imagesUrl ??
        product.images_url ??
        product.media ??
        product.gallery ??
        product.photos ??
        product.attachments ??
        primaryVariant.image ??
        primaryVariant.imageUrl ??
        primaryVariant.thumbnail ??
        record.productImage ??
        record.product_image ??
        record.productThumbnail ??
        record.product_thumbnail,
    ) || undefined;

  return {
    id: toStringSafe(record.id),
    rating: Math.max(0, Math.min(5, toNumber(record.rating, 0))),
    comment: toStringSafe(record.comment, "") || null,
    status: toReviewStatus(record.status),
    createdAt: toStringSafe(record.createdAt ?? record.created_at),
    updatedAt: toStringSafe(
      record.updatedAt ?? record.updated_at ?? record.createdAt ?? record.created_at,
    ),
    user: {
      id: toStringSafe(user.id),
      firstName: firstNonEmptyString(user.firstName, user.first_name, firstFromName) || "N/A",
      lastName: firstNonEmptyString(user.lastName, user.last_name, lastFromName) || "",
      email: toStringSafe(user.email),
      phone: firstNonEmptyString(user.phone, user.mobile, user.mobileNumber, user.mobile_number),
      profileImage: resolveImageUrl(user.profileImage ?? user.image ?? user.avatar) || undefined,
    },
    product: {
      id: toStringSafe(product.id ?? record.productId ?? record.product_id),
      name: firstNonEmptyString(product.name, product.title) || "Unknown Product",
      sku: resolvedSku,
      image: resolvedProductImage,
    },
    media: normalizedMedia,
  };
};

const extractProductFromDetailsPayload = (value: unknown): UnknownRecord => {
  const payload = unwrap<unknown>(value);
  if (!payload || typeof payload !== "object") {
    return {};
  }

  const record = payload as UnknownRecord;
  const dataNode = asRecord(record.data);
  return asRecord(dataNode.product ?? record.product ?? dataNode ?? record);
};

const buildEnrichedProductData = (productDetails: UnknownRecord): ProductEnrichment => {
  const detailVariantCandidates = [
    productDetails.variant,
    productDetails.productVariant,
    productDetails.selectedVariant,
    Array.isArray(productDetails.variants) ? productDetails.variants[0] : null,
    Array.isArray(productDetails.productVariants) ? productDetails.productVariants[0] : null,
  ];

  const sku =
    firstMeaningfulString(
      productDetails.sku,
      productDetails.SKU,
      productDetails.variantSku,
      productDetails.variant_sku,
      ...detailVariantCandidates.flatMap((candidate) => collectVariantTextCandidates(candidate)),
    ) || undefined;

  const image =
    resolveFirstAssetUrl(
      productDetails.image ??
        productDetails.imageUrl ??
        productDetails.image_url ??
        productDetails.thumbnail ??
        productDetails.thumbnailUrl ??
        productDetails.images ??
        productDetails.imageUrls ??
        productDetails.imagesUrl ??
        productDetails.images_url ??
        productDetails.media ??
        productDetails.gallery,
    ) || undefined;

  return { sku, image };
};

const getProductEnrichment = async (productId: string): Promise<ProductEnrichment> => {
  const now = Date.now();
  const cached = productEnrichmentCache.get(productId);
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const pending = productEnrichmentInFlight.get(productId);
  if (pending) {
    return pending;
  }

  const request = (async () => {
    try {
      const productResponse = await api.get(`/admin/products/${productId}`);
      const productDetails = extractProductFromDetailsPayload(productResponse.data);
      const enriched = buildEnrichedProductData(productDetails);

      productEnrichmentCache.set(productId, {
        value: enriched,
        expiresAt: Date.now() + PRODUCT_ENRICHMENT_TTL_MS,
      });

      return enriched;
    } catch {
      const fallback: ProductEnrichment = {};
      productEnrichmentCache.set(productId, {
        value: fallback,
        expiresAt: Date.now() + PRODUCT_ENRICHMENT_TTL_MS,
      });
      return fallback;
    } finally {
      productEnrichmentInFlight.delete(productId);
    }
  })();

  productEnrichmentInFlight.set(productId, request);
  return request;
};

const resolvePagination = (payload: UnknownRecord, fallback: AdminReviewsFilters): AdminReviewsPagination => {
  const pagination = (payload.pagination ?? payload.meta ?? {}) as UnknownRecord;
  const page = Math.max(
    DEFAULT_PAGE,
    toNumber(payload.page ?? pagination.currentPage ?? pagination.page ?? fallback.page, DEFAULT_PAGE),
  );
  const limit = Math.max(
    1,
    toNumber(payload.limit ?? pagination.limit ?? fallback.limit ?? DEFAULT_LIMIT, DEFAULT_LIMIT),
  );
  const totalItems = Math.max(
    0,
    toNumber(payload.totalItems ?? pagination.totalItems ?? pagination.count ?? 0, 0),
  );
  const computedPages = Math.max(1, Math.ceil(totalItems / limit));
  const totalPages = Math.max(
    1,
    toNumber(payload.totalPages ?? pagination.totalPages ?? pagination.pages ?? computedPages, computedPages),
  );

  return { page, limit, totalItems, totalPages };
};

export const sanitizeAdminReviewsFilters = (filters: AdminReviewsFilters): AdminReviewsFilters => {
  const next: AdminReviewsFilters = {
    page: Math.max(DEFAULT_PAGE, filters.page || DEFAULT_PAGE),
    limit: Math.max(1, filters.limit || DEFAULT_LIMIT),
  };

  if (filters.status) {
    next.status = filters.status;
  }
  if (filters.reviewId?.trim()) {
    next.reviewId = filters.reviewId.trim();
  }
  if (filters.productId?.trim()) {
    next.productId = filters.productId.trim();
  }
  if (filters.userId?.trim()) {
    next.userId = filters.userId.trim();
  }
  if (filters.startDate?.trim()) {
    next.startDate = filters.startDate.trim();
  }
  if (filters.endDate?.trim()) {
    next.endDate = filters.endDate.trim();
  }

  return next;
};

export const adminReviewsService = {
  async getAdminReviews(filters: AdminReviewsFilters): Promise<AdminReviewsResponse> {
    const safeFilters = sanitizeAdminReviewsFilters(filters);
    const response = await api.get("/api/admin/reviews", { params: safeFilters });
    const payload = unwrap<unknown>(response.data);
    const record = (payload ?? {}) as UnknownRecord;

    const rawItems =
      (Array.isArray(payload) ? payload : null) ??
      (Array.isArray(record.items) ? record.items : null) ??
      (Array.isArray(record.reviews) ? record.reviews : null) ??
      (Array.isArray(record.data) ? record.data : null) ??
      [];

    const normalizedItems = rawItems.map(normalizeReview);

    const needsEnrichmentIds = Array.from(
      new Set(
        normalizedItems
          .filter(
            (item) =>
              Boolean(item.product.id) &&
              (!item.product.image || !item.product.sku || item.product.sku === "N/A"),
          )
          .map((item) => item.product.id),
      ),
    );

    if (needsEnrichmentIds.length === 0) {
      return {
        items: normalizedItems,
        pagination: resolvePagination(record, safeFilters),
      };
    }

    const enrichedByProductId = new Map<string, ProductEnrichment>();

    await Promise.all(
      needsEnrichmentIds.map(async (productId) => {
        const enriched = await getProductEnrichment(String(productId));
        enrichedByProductId.set(String(productId), enriched);
      }),
    );

    const items = normalizedItems.map((item) => {
      const enriched = enrichedByProductId.get(String(item.product.id));
      if (!enriched) {
        return item;
      }

      return {
        ...item,
        product: {
          ...item.product,
          image: item.product.image || enriched.image,
          sku: item.product.sku === "N/A" ? enriched.sku || item.product.sku : item.product.sku,
        },
      };
    });

    return {
      items,
      pagination: resolvePagination(record, safeFilters),
    };
  },

  async updateReviewStatus(input: UpdateReviewStatusPayload): Promise<void> {
    await api.patch(`/api/admin/reviews/${input.id}/status`, {
      status: input.status,
    });
  },

  async deleteReview(input: DeleteReviewPayload): Promise<void> {
    await api.delete(`/api/admin/reviews/${input.id}`);
  },
};
