import { Suspense } from "react";
import AdminLoyaltyUserDetailsPage from "@/features/loyalty/pages/AdminLoyaltyUserDetailsPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AdminLoyaltyUserDetailsPage />
    </Suspense>
  );
}
