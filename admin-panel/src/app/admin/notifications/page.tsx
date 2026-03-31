import { Suspense } from "react";
import AdminNotificationsPage from "@/modules/notifications/pages/AdminNotificationsPage";

export default function NotificationsRoutePage() {
  return (
    <Suspense fallback={null}>
      <AdminNotificationsPage />
    </Suspense>
  );
}
