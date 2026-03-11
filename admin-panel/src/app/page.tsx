"use client";

import Link from "next/link";
import HomeAuthAction from "@/components/layout/HomeAuthAction";
import TeamModuleCard from "@/features/team/components/TeamModuleCard";
import LanguageSwitcher from "@/modules/localization/components/LanguageSwitcher";
import { useLocalization } from "@/modules/localization/LocalizationProvider";
import {
  BarChart3,
  Boxes,
  CalendarDays,
  CreditCard,
  FileText,
  Globe,
  PackageCheck,
  ShoppingCart,
  Tag,
  type LucideIcon,
} from "lucide-react";

type ModuleItem = {
  key: string;
  href: string;
  icon: LucideIcon;
};

const modules: ModuleItem[] = [
  { key: "dashboards", href: "/dashboard", icon: BarChart3 },
  { key: "inventory", href: "/products", icon: Boxes },
  { key: "crm", href: "/admin/crm/pipeline", icon: ShoppingCart },
  { key: "calendar", href: "/calendar", icon: CalendarDays },
  { key: "pos", href: "/admin/pos", icon: CreditCard },
  { key: "invoices", href: "/admin/invoices", icon: FileText },
  { key: "purchases", href: "/purchases", icon: PackageCheck },
  { key: "website", href: "/admin/homepage-control", icon: Globe },
  { key: "promoCodes", href: "/admin/promo-codes", icon: Tag },
];

const copy = {
  en: {
    title: "Admin Modules",
    subtitle: "Manage and control all system modules from one place",
    dashboardsTitle: "Dashboards",
    dashboardsDescription: "Revenue analytics, sales insights and performance tracking.",
    inventoryTitle: "Inventory",
    inventoryDescription: "Manage products, stock, categories and variants.",
    crmTitle: "CRM",
    crmDescription: "View and manage customer orders.",
    calendarTitle: "Calendar",
    calendarDescription: "Manage delivery schedules and operational events.",
    posTitle: "POS",
    posDescription: "Retail sales and cash register.",
    invoicesTitle: "Invoices",
    invoicesDescription: "Manage customer invoices, payments and credit notes.",
    purchasesTitle: "Purchases",
    purchasesDescription: "Manage product purchases, suppliers, and operational costs.",
    websiteTitle: "Website",
    websiteDescription: "Control website content and static pages.",
    promoCodesTitle: "Promo Codes",
    promoCodesDescription: "Manage discounts and promotional campaigns.",
  },
  ar: {
    title: "وحدات الإدارة",
    subtitle: "أدر وتحكم في جميع وحدات النظام من مكان واحد",
    dashboardsTitle: "لوحات المعلومات",
    dashboardsDescription: "تحليلات الإيرادات ورؤى المبيعات وتتبع الأداء.",
    inventoryTitle: "المخزون",
    inventoryDescription: "إدارة المنتجات والمخزون والفئات والمتغيرات.",
    crmTitle: "إدارة العملاء",
    crmDescription: "عرض وإدارة طلبات العملاء.",
    calendarTitle: "التقويم",
    calendarDescription: "إدارة جداول التسليم والفعاليات التشغيلية.",
    posTitle: "نقطة البيع",
    posDescription: "مبيعات المتجر ونقطة التحصيل.",
    invoicesTitle: "الفواتير",
    invoicesDescription: "إدارة فواتير العملاء والمدفوعات والإشعارات الدائنة.",
    purchasesTitle: "المشتريات",
    purchasesDescription: "إدارة مشتريات المنتجات والموردين والمصاريف التشغيلية.",
    websiteTitle: "الموقع",
    websiteDescription: "التحكم في محتوى الموقع والصفحات الثابتة.",
    promoCodesTitle: "أكواد الخصم",
    promoCodesDescription: "إدارة الخصومات والحملات الترويجية.",
  },
} as const;

export default function HomePage() {
  const { direction, language } = useLocalization();
  const text = copy[language];

  return (
    <main className="min-h-screen bg-slate-50/80 px-6 py-10 md:px-10 lg:px-14">
      <div className="mx-auto w-full max-w-7xl">
        <div
          className={`mb-6 flex flex-wrap items-center gap-3 ${
            direction === "rtl" ? "justify-between" : "justify-between"
          }`}
        >
          <HomeAuthAction />
          <LanguageSwitcher />
        </div>

        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            {text.title}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-500 md:text-base">
            {text.subtitle}
          </p>
        </header>

        <section className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => {
            const Icon = module.icon;
            const title = text[`${module.key}Title` as keyof typeof text] as string;
            const description = text[`${module.key}Description` as keyof typeof text] as string;

            return (
              <Link
                key={module.key}
                href={module.href}
                className="group rounded-xl bg-white p-8 text-center shadow-sm transition duration-300 hover:scale-105 hover:shadow-lg"
              >
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 via-indigo-100 to-cyan-100">
                  <Icon className="h-10 w-10 text-slate-700" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">{description}</p>
              </Link>
            );
          })}
          <TeamModuleCard />
        </section>
      </div>
    </main>
  );
}
