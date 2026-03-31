import { Suspense } from "react";
import AdminDashboardPage from "@/modules/dashboard/pages/AdminDashboardPage";

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <AdminDashboardPage />
    </Suspense>
  );
}
