import Link from "next/link";
import HomeAuthAction from "@/components/layout/HomeAuthAction";
import TeamModuleCard from "@/features/team/components/TeamModuleCard";
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
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

const modules: ModuleItem[] = [
  {
    title: "Dashboards",
    description: "Revenue analytics, sales insights & performance tracking.",
    href: "/dashboard",
    icon: BarChart3,
  },
  {
    title: "Inventory",
    description: "Manage products, stock, categories & variants.",
    href: "/products",
    icon: Boxes,
  },
  {
    title: "CRM",
    description: "View and manage customer orders.",
    href: "/admin/crm/pipeline",
    icon: ShoppingCart,
  },
  {
    title: "Calendar",
    description: "Manage delivery schedules and operational events.",
    href: "/calendar",
    icon: CalendarDays,
  },
  {
    title: "POS",
    description: "Retail sales & cash register.",
    href: "/admin/pos",
    icon: CreditCard,
  },
  {
    title: "Invoices",
    description: "Manage customer invoices, payments & credit notes",
    href: "/admin/invoices",
    icon: FileText,
  },
  {
    title: "Purchases",
    description: "Manage product purchases, suppliers, and operational costs.",
    href: "/purchases",
    icon: PackageCheck,
  },
  {
    title: "Website",
    description: "Control website content and static pages.",
    href: "/admin/homepage-control",
    icon: Globe,
  },
  {
    title: "Promo Codes",
    description: "Manage discounts and promotional campaigns.",
    href: "/admin/promo-codes",
    icon: Tag,
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50/80 px-6 py-10 md:px-10 lg:px-14">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-6 flex justify-end">
          <HomeAuthAction />
        </div>

        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Admin Modules
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-500 md:text-base">
            Manage and control all system modules from one place
          </p>
        </header>

        <section className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => {
            const Icon = module.icon;

            return (
              <Link
                key={module.title}
                href={module.href}
                className="group rounded-xl bg-white p-8 text-center shadow-sm transition duration-300 hover:scale-105 hover:shadow-lg"
              >
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 via-indigo-100 to-cyan-100">
                  <Icon className="h-10 w-10 text-slate-700" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">{module.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">
                  {module.description}
                </p>
              </Link>
            );
          })}
          <TeamModuleCard />
        </section>
      </div>
    </main>
  );
}
