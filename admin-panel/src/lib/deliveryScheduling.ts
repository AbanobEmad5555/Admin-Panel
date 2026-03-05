import api from "@/services/api";

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord =>
  value && typeof value === "object" ? (value as UnknownRecord) : {};

const toNumberSafe = (value: unknown, fallback = 0) => {
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

const normalizeDeliverySettings = (value: unknown) => {
  const payload = asRecord(value);
  const nestedSettings = asRecord(payload.settings);
  const methodsNode = asRecord(payload.methods);
  const settingsMethodsNode = asRecord(nestedSettings.methods);
  const hasNestedSettings =
    "defaultDeliveryMethod" in nestedSettings ||
    "default_delivery_method" in nestedSettings ||
    "STANDARD" in nestedSettings ||
    "standard" in nestedSettings ||
    "standard_delivery_days" in nestedSettings ||
    "standardDeliveryDays" in nestedSettings;
  const settingsNode = hasNestedSettings ? nestedSettings : payload;
  const resolvedMethodsNode =
    Object.keys(settingsMethodsNode).length > 0
      ? settingsMethodsNode
      : Object.keys(methodsNode).length > 0
        ? methodsNode
        : {};

  const standard = asRecord(
    settingsNode.STANDARD ?? settingsNode.standard ?? resolvedMethodsNode.STANDARD,
  );
  const express = asRecord(
    settingsNode.EXPRESS ?? settingsNode.express ?? resolvedMethodsNode.EXPRESS,
  );
  const flatStandardDays =
    settingsNode.standardDeliveryDays ?? settingsNode.standard_delivery_days;
  const flatExpressDays =
    settingsNode.expressDeliveryDays ?? settingsNode.express_delivery_days;
  const methodValue = String(
    settingsNode.defaultDeliveryMethod ?? settingsNode.default_delivery_method ?? "STANDARD",
  )
    .trim()
    .toUpperCase();

  const defaultDeliveryMethod = methodValue === "EXPRESS" ? "EXPRESS" : "STANDARD";

  return {
    defaultDeliveryMethod,
    STANDARD: {
      deliveryDays: Math.max(
        0,
        toNumberSafe(
          standard.deliveryDays ?? standard.delivery_days ?? flatStandardDays,
          3,
        ),
      ),
    },
    EXPRESS: {
      deliveryDays: Math.max(
        0,
        toNumberSafe(
          express.deliveryDays ?? express.delivery_days ?? flatExpressDays,
          1,
        ),
      ),
    },
  };
};

const addDaysToIso = (iso: string, days: number) => {
  const base = new Date(iso);
  if (Number.isNaN(base.getTime())) {
    return new Date().toISOString();
  }
  base.setDate(base.getDate() + Math.max(0, days));
  return base.toISOString();
};

export type DeliveryDateAssignmentResult = {
  success: boolean;
  deliveryDate?: string;
  deliveryDays?: number;
  error?: unknown;
};

export const assignOrderDeliveryDateForOutForDelivery = async (
  orderId: string | number,
): Promise<DeliveryDateAssignmentResult> => {
  try {
    const settingsResponse = await api.get("/api/admin/calendar/settings");
    const settingsPayload =
      (settingsResponse.data as { data?: unknown })?.data ?? settingsResponse.data;
    const settings = normalizeDeliverySettings(settingsPayload);
    const selected =
      settings.defaultDeliveryMethod === "EXPRESS"
        ? settings.EXPRESS
        : settings.STANDARD;
    const deliveryDate = addDaysToIso(new Date().toISOString(), selected.deliveryDays);

    await api.patch(`/api/admin/orders/${orderId}/delivery-date`, {
      deliveryDate,
    });

    return {
      success: true,
      deliveryDate,
      deliveryDays: selected.deliveryDays,
    };
  } catch (error) {
    return {
      success: false,
      error,
    };
  }
};
