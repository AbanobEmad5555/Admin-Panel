"use client";

import { useEffect, type ReactNode } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

type AdminLayoutProps = {
  children: ReactNode;
  title?: string;
};

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const { isAuthenticated } = useAuth();
  const { direction } = useLocalization();

  useEffect(() => {
    if (!title || typeof document === "undefined") {
      return;
    }

    document.title = title;
  }, [title]);

  if (isAuthenticated === false) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-100" dir={direction}>
      <div className="flex">
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <Header />
          <main className={`flex-1 p-6 ${direction === "rtl" ? "text-right" : ""}`}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
