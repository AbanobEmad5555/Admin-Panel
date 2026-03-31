"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AdminAuthProvider } from "@/features/admin-auth/AdminAuthProvider";
import { LocalizationProvider } from "@/modules/localization/LocalizationProvider";

type AppProvidersProps = {
  children: React.ReactNode;
};

export default function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <LocalizationProvider>
        <AdminAuthProvider>
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            theme="dark"
            toastOptions={{
              classNames: {
                toast:
                  "border border-white/10 bg-slate-950/90 text-slate-100 shadow-[0_24px_60px_rgba(2,6,23,0.55)] backdrop-blur-xl",
                title: "text-sm font-semibold text-slate-50",
                description: "text-xs text-slate-300",
                actionButton: "!bg-cyan-400 !text-slate-950",
                cancelButton: "!bg-white/10 !text-slate-100",
              },
            }}
          />
        </AdminAuthProvider>
      </LocalizationProvider>
    </QueryClientProvider>
  );
}
