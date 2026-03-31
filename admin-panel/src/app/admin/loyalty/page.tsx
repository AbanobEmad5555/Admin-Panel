import { Suspense } from "react";
import AdminLoyaltyOverviewPage from "@/features/loyalty/pages/AdminLoyaltyOverviewPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AdminLoyaltyOverviewPage />
    </Suspense>
  );
}
