import { Suspense } from "react";
import AdminLoyaltyUsersPage from "@/features/loyalty/pages/AdminLoyaltyUsersPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AdminLoyaltyUsersPage />
    </Suspense>
  );
}
