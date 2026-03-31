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
          <Toaster position="top-right" richColors closeButton />
        </AdminAuthProvider>
      </LocalizationProvider>
    </QueryClientProvider>
  );
}
