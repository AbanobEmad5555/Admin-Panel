import { Suspense } from "react";
import AdminRatingsPage from "@/features/admin-reviews/pages/AdminRatingsPage";

export default function RatingsRoutePage() {
  return (
    <Suspense fallback={null}>
      <AdminRatingsPage />
    </Suspense>
  );
}
