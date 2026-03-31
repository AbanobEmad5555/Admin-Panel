import { Suspense } from "react";
import AdminLoyaltySettingsPage from "@/features/loyalty/pages/AdminLoyaltySettingsPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AdminLoyaltySettingsPage />
    </Suspense>
  );
}
