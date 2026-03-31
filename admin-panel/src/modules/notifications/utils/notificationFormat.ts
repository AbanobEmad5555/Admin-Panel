import { format, formatDistanceToNowStrict, isValid, parseISO } from "date-fns";
import { arSA, enUS } from "date-fns/locale";
import type { AdminLanguage } from "@/modules/localization/types";
import type { NotificationItem, NotificationModule, NotificationSeverity } from "@/modules/notifications/types/notifications.types";

const moduleLabels: Record<AdminLanguage, Record<NotificationModule, string>> = {
  en: {
    dashboards: "Dashboards",
    inventory: "Inventory",
    crm: "CRM",
    calendar: "Calendar",
    pos: "POS",
    invoices: "Invoices",
    purchases: "Purchases",
    website: "Website",
    "promo-codes": "Promo Codes",
    team: "Team",
    "loyalty-program": "Loyalty Program",
    system: "System",
  },
  ar: {
    dashboards: "لوحات المعلومات",
    inventory: "المخزون",
    crm: "إدارة العملاء",
    calendar: "التقويم",
    pos: "نقطة البيع",
    invoices: "الفواتير",
    purchases: "المشتريات",
    website: "الموقع",
    "promo-codes": "أكواد الخصم",
    team: "الفريق",
    "loyalty-program": "برنامج الولاء",
    system: "النظام",
  },
};

const severityLabels: Record<AdminLanguage, Record<NotificationSeverity, string>> = {
  en: {
    INFO: "Info",
    WARNING: "Warning",
    CRITICAL: "Critical",
  },
  ar: {
    INFO: "معلومة",
    WARNING: "تحذير",
    CRITICAL: "حرج",
  },
};

const orderStatusLabels: Record<AdminLanguage, Record<string, string>> = {
  en: {
    CONFIRMED: "CONFIRMED",
    COMPLETED: "COMPLETED",
    DELIVERED: "DELIVERED",
    PENDING: "PENDING",
    CANCELLED: "CANCELLED",
    OUT_FOR_DELIVERY: "OUT FOR DELIVERY",
  },
  ar: {
    CONFIRMED: "مؤكد",
    COMPLETED: "مكتمل",
    DELIVERED: "تم التسليم",
    PENDING: "قيد الانتظار",
    CANCELLED: "ملغي",
    OUT_FOR_DELIVERY: "خرج للتسليم",
  },
};

type NotificationReplacement = string | ((...args: string[]) => string);

const englishToArabicPhrases: Array<[RegExp, NotificationReplacement]> = [
  [/Order #(\d+) completed/gi, "اكتمل الطلب رقم #$1"],
  [/Order #(\d+) has been completed\.?/gi, "تم إكمال الطلب رقم #$1."],
  [/Delivery schedule updated/gi, "تم تحديث جدول التسليم"],
  [/Order #(\d+) delivery date has been changed\.?/gi, "تم تغيير تاريخ تسليم الطلب رقم #$1."],
  [/Order #(\d+) out for delivery/gi, "الطلب رقم #$1 خرج للتسليم"],
  [/Order #(\d+) is now out for delivery\.?/gi, "الطلب رقم #$1 خرج للتسليم الآن."],
  [/Order #(\d+) confirmed/gi, "تم تأكيد الطلب رقم #$1"],
  [/Order #(\d+) status changed to ([A-Z_ ]+)\.?/gi, (_match, id, status) => {
    const normalizedStatus = String(status).trim().replace(/\s+/g, "_").toUpperCase();
    const translated = orderStatusLabels.ar[normalizedStatus] ?? status;
    return `تم تغيير حالة الطلب رقم #${id} إلى ${translated}.`;
  }],
];

const notificationTypeLabels: Record<AdminLanguage, Record<string, string>> = {
  en: {
    ORDER_COMPLETED: "Order completed",
    DELIVERY_SCHEDULE_CHANGED: "Delivery schedule changed",
    ORDER_STATUS_UPDATED: "Order status updated",
  },
  ar: {
    ORDER_COMPLETED: "اكتمل الطلب",
    DELIVERY_SCHEDULE_CHANGED: "تغير جدول التسليم",
    ORDER_STATUS_UPDATED: "تم تحديث حالة الطلب",
  },
};

export const getNotificationModuleLabel = (
  module: NotificationModule,
  language: AdminLanguage,
) => moduleLabels[language][module] ?? module;

export const getNotificationSeverityLabel = (
  severity: NotificationSeverity | null | undefined,
  language: AdminLanguage,
) => {
  if (!severity) {
    return null;
  }
  return severityLabels[language][severity] ?? severity;
};

const parseDate = (value: string) => {
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
};

const getDateLocale = (language: AdminLanguage) => (language === "ar" ? arSA : enUS);

export const formatNotificationRelativeTime = (value: string, language: AdminLanguage) => {
  const parsed = parseDate(value);
  if (!parsed) {
    return language === "ar" ? "وقت غير معروف" : "Unknown time";
  }
  return `${formatDistanceToNowStrict(parsed, {
    addSuffix: true,
    locale: getDateLocale(language),
  })}`;
};

export const formatNotificationDateTime = (value: string, language: AdminLanguage) => {
  const parsed = parseDate(value);
  if (!parsed) {
    return language === "ar" ? "وقت غير معروف" : "Unknown time";
  }
  return format(parsed, "MMM d, yyyy h:mm a", {
    locale: getDateLocale(language),
  });
};

export const formatUnreadCount = (count: number) => {
  if (count > 99) {
    return "99+";
  }
  return String(count);
};

const extractStatusHint = (notification: NotificationItem) => {
  const metadata = notification.metadata ?? {};
  const candidates = [
    notification.type,
    notification.entityType,
    metadata.status,
    metadata.purchaseStatus,
    metadata.nextStatus,
    metadata.newStatus,
    metadata.toStatus,
    metadata.state,
  ];

  for (const candidate of candidates) {
    if (typeof candidate !== "string") {
      continue;
    }

    const normalized = candidate.trim().replace(/[\s-]+/g, "_").toUpperCase();
    if (normalized) {
      return normalized;
    }
  }

  return "";
};

const normalizePurchasesContent = (
  notification: NotificationItem,
  content: { title: string; message: string },
  language: AdminLanguage,
) => {
  if (notification.module !== "purchases") {
    return content;
  }

  const statusHint = extractStatusHint(notification);
  const isInTransit =
    statusHint.includes("IN_TRANSIT") ||
    statusHint.includes("SHIPPED") ||
    /in[\s-]?transit/i.test(notification.title) ||
    /in[\s-]?transit/i.test(notification.message);

  if (!isInTransit) {
    return content;
  }

  if (language === "ar") {
    return {
      title: content.title
        .replace(/تم تسليم عملية الشراء/gi, "تم شحن عملية الشراء")
        .replace(/شراء تم تسليمه/gi, "شراء تم شحنه"),
      message: content.message
        .replace(/تم تسليم عملية الشراء/gi, "تم شحن عملية الشراء")
        .replace(/تم التسليم/gi, "تم الشحن"),
    };
  }

  return {
    title: content.title
      .replace(/purchase delivered/gi, "Purchase shipped")
      .replace(/delivered purchase/gi, "Shipped purchase"),
    message: content.message
      .replace(/has been delivered/gi, "has been shipped")
      .replace(/was delivered/gi, "was shipped"),
  };
};

const localizeRawNotificationText = (value: string, language: AdminLanguage) => {
  if (language !== "ar") {
    return value;
  }

  return englishToArabicPhrases.reduce((current, [pattern, replacement]) => {
    return current.replace(pattern, replacement as never);
  }, value);
};

export const getNotificationTypeLabel = (type: string, language: AdminLanguage) => {
  const normalized = type.trim().toUpperCase();
  return notificationTypeLabels[language][normalized] ?? type;
};

export const getLocalizedNotificationContent = (
  notification: NotificationItem,
  language: AdminLanguage,
) => {
  const localizedContent = {
    title: localizeRawNotificationText(notification.title, language),
    message: localizeRawNotificationText(notification.message, language),
  };

  return normalizePurchasesContent(notification, localizedContent, language);
};
