import {
  BarChart3,
  Boxes,
  CalendarDays,
  CreditCard,
  FileText,
  Gem,
  Globe,
  PackageCheck,
  ShoppingCart,
  Tag,
  Users,
} from "lucide-react";
import type {
  DashboardModuleDefinition,
  DashboardModuleId,
} from "@/modules/dashboard-layout/types/dashboardLayout.types";

export const DASHBOARD_MODULE_REGISTRY: Record<DashboardModuleId, DashboardModuleDefinition> = {
  dashboards: {
    moduleId: "dashboards",
    route: "/dashboard",
    enabled: true,
    icon: BarChart3,
    copy: {
      en: {
        title: "Dashboards",
        description: "Revenue analytics, sales insights and performance tracking.",
        comingSoon: "Coming soon",
      },
      ar: {
        title: "لوحات المعلومات",
        description: "تحليلات الإيرادات ورؤى المبيعات وتتبع الأداء.",
        comingSoon: "قريبًا",
      },
    },
  },
  inventory: {
    moduleId: "inventory",
    route: "/admin/products",
    enabled: true,
    icon: Boxes,
    copy: {
      en: {
        title: "Inventory",
        description: "Manage products, stock, categories and variants.",
        comingSoon: "Coming soon",
      },
      ar: {
        title: "المخزون",
        description: "إدارة المنتجات والمخزون والفئات والمتغيرات.",
        comingSoon: "قريبًا",
      },
    },
  },
  crm: {
    moduleId: "crm",
    route: "/admin/crm/pipeline",
    enabled: true,
    icon: ShoppingCart,
    copy: {
      en: {
        title: "CRM",
        description: "View and manage customer orders and leads.",
        comingSoon: "Coming soon",
      },
      ar: {
        title: "إدارة العملاء",
        description: "عرض وإدارة طلبات العملاء والعملاء المحتملين.",
        comingSoon: "قريبًا",
      },
    },
  },
  calendar: {
    moduleId: "calendar",
    route: "/calendar",
    enabled: true,
    icon: CalendarDays,
    copy: {
      en: {
        title: "Calendar",
        description: "Manage delivery schedules and operational events.",
        comingSoon: "Coming soon",
      },
      ar: {
        title: "التقويم",
        description: "إدارة جداول التسليم والفعاليات التشغيلية.",
        comingSoon: "قريبًا",
      },
    },
  },
  pos: {
    moduleId: "pos",
    route: "/admin/pos",
    enabled: true,
    icon: CreditCard,
    copy: {
      en: {
        title: "POS",
        description: "Retail sales and cash register workflows.",
        comingSoon: "Coming soon",
      },
      ar: {
        title: "نقطة البيع",
        description: "مبيعات المتجر ونقطة التحصيل.",
        comingSoon: "قريبًا",
      },
    },
  },
  invoices: {
    moduleId: "invoices",
    route: "/admin/invoices",
    enabled: true,
    icon: FileText,
    copy: {
      en: {
        title: "Invoices",
        description: "Manage customer invoices, payments and credit notes.",
        comingSoon: "Coming soon",
      },
      ar: {
        title: "الفواتير",
        description: "إدارة فواتير العملاء والمدفوعات والإشعارات الدائنة.",
        comingSoon: "قريبًا",
      },
    },
  },
  purchases: {
    moduleId: "purchases",
    route: "/purchases",
    enabled: true,
    icon: PackageCheck,
    copy: {
      en: {
        title: "Purchases",
        description: "Manage product purchases, suppliers and operational costs.",
        comingSoon: "Coming soon",
      },
      ar: {
        title: "المشتريات",
        description: "إدارة مشتريات المنتجات والموردين والمصاريف التشغيلية.",
        comingSoon: "قريبًا",
      },
    },
  },
  website: {
    moduleId: "website",
    route: "/admin/homepage-control",
    enabled: true,
    icon: Globe,
    copy: {
      en: {
        title: "Website",
        description: "Control website content and static pages.",
        comingSoon: "Coming soon",
      },
      ar: {
        title: "الموقع",
        description: "التحكم في محتوى الموقع والصفحات الثابتة.",
        comingSoon: "قريبًا",
      },
    },
  },
  "promo-codes": {
    moduleId: "promo-codes",
    route: "/admin/promo-codes",
    enabled: true,
    icon: Tag,
    copy: {
      en: {
        title: "Promo Codes",
        description: "Manage discounts and promotional campaigns.",
        comingSoon: "Coming soon",
      },
      ar: {
        title: "أكواد الخصم",
        description: "إدارة الخصومات والحملات الترويجية.",
        comingSoon: "قريبًا",
      },
    },
  },
  team: {
    moduleId: "team",
    route: "/admin/team",
    enabled: true,
    icon: Users,
    copy: {
      en: {
        title: "Team",
        description: "Manage employees, roles, documents and status.",
        comingSoon: "Coming soon",
      },
      ar: {
        title: "الفريق",
        description: "إدارة الموظفين والأدوار والمستندات والحالة.",
        comingSoon: "قريبًا",
      },
    },
  },
  "loyalty-program": {
    moduleId: "loyalty-program",
    route: "/admin/loyalty",
    enabled: true,
    icon: Gem,
    copy: {
      en: {
        title: "Loyalty Program",
        description: "Customer rewards and retention tools.",
        comingSoon: "Coming soon",
      },
      ar: {
        title: "برنامج الولاء",
        description: "أدوات مكافآت العملاء وتعزيز الاحتفاظ بهم.",
        comingSoon: "قريبًا",
      },
    },
  },
};

export const DASHBOARD_MODULE_ORDER = Object.keys(
  DASHBOARD_MODULE_REGISTRY
) as DashboardModuleId[];
