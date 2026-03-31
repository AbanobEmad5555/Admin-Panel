"use client";

import Link from "next/link";
import AdminLayout from "@/components/layout/AdminLayout";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

type POSLayoutProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

const navItems = [
  { href: "/admin/pos", key: "posTerminal" },
  { href: "/admin/pos/daily-report", key: "dailyReport" },
  { href: "/admin/pos/session-report", key: "sessionReport" },
  { href: "/admin/pos/top-products", key: "topProducts" },
] as const;

export default function POSLayout({ title, description, children }: POSLayoutProps) {
  const { language } = useLocalization();

  const labels =
    language === "ar"
      ? {
          posTerminal: "Ù…Ø­Ø·Ø© Ù†Ù‚Ø·Ø© Ø§Ù„Ø¨ÙŠØ¹",
          dailyReport: "Ø§Ù„ØªÙ‚Ø±ÙŠØ± Ø§Ù„ÙŠÙˆÙ…ÙŠ",
          sessionReport: "ØªÙ‚Ø±ÙŠØ± Ø§Ù„Ø¬Ù„Ø³Ø©",
          topProducts: "Ø£ÙØ¶Ù„ Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª",
        }
      : {
          posTerminal: "POS Terminal",
          dailyReport: "Daily Report",
          sessionReport: "Session Report",
          topProducts: "Top Products",
        };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow={language === "ar" ? "نقطة البيع" : "Point of Sale"}
          title={title}
          description={description}
          actions={
            <div className="flex flex-wrap gap-2">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button variant="secondary" size="sm">
                    {labels[item.key]}
                  </Button>
                </Link>
              ))}
            </div>
          }
        />

        {children}
      </div>
    </AdminLayout>
  );
}
