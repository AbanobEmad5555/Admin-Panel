"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useAdminAuth } from "@/features/admin-auth/AdminAuthProvider";
import { adminAuthApi } from "@/features/admin-auth/api/adminAuth.api";
import { useLocalization } from "@/modules/localization/LocalizationProvider";

export default function AdminForcedPasswordChangePage() {
  const router = useRouter();
  const { direction, language } = useLocalization();
  const { isAuthenticated, mustChangePassword, refreshAuth, profile } = useAdminAuth();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const text = useMemo(
    () =>
      language === "ar"
        ? {
            title: "تغيير كلمة المرور",
            subtitle: "يجب تغيير كلمة المرور المؤقتة قبل الوصول إلى لوحة الإدارة.",
            currentPassword: "كلمة المرور الحالية",
            newPassword: "كلمة المرور الجديدة",
            confirmPassword: "تأكيد كلمة المرور الجديدة",
            submit: "تحديث كلمة المرور",
            submitting: "جارٍ التحديث...",
            mismatch: "كلمتا المرور الجديدتان غير متطابقتين.",
            tooShort: "يجب أن تكون كلمة المرور الجديدة 8 أحرف على الأقل.",
            successRedirect: "تم تحديث كلمة المرور. جارٍ نقلك...",
            genericError: "تعذر تحديث كلمة المرور.",
          }
        : {
            title: "Change Password",
            subtitle: "You must change the temporary password before accessing the admin panel.",
            currentPassword: "Current password",
            newPassword: "New password",
            confirmPassword: "Confirm new password",
            submit: "Update password",
            submitting: "Updating...",
            mismatch: "The new passwords do not match.",
            tooShort: "The new password must be at least 8 characters.",
            successRedirect: "Password updated. Redirecting...",
            genericError: "Failed to update password.",
          },
    [language]
  );

  useEffect(() => {
    if (isAuthenticated === false) {
      router.replace("/login");
      return;
    }

    if (isAuthenticated && !mustChangePassword) {
      router.replace("/");
    }
  }, [isAuthenticated, mustChangePassword, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError(text.tooShort);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(text.mismatch);
      return;
    }

    setIsSubmitting(true);
    try {
      await adminAuthApi.changeInitialPassword({ oldPassword, newPassword });
      await refreshAuth();
      setError(text.successRedirect);
      router.replace("/");
    } catch (requestError) {
      const message =
        (requestError as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        text.genericError;
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4" dir={direction}>
      <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">{text.title}</h1>
          <p className="text-sm text-slate-500">{text.subtitle}</p>
          {profile?.email ? <p className="mt-2 text-xs text-slate-500">{profile.email}</p> : null}
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{text.currentPassword}</label>
            <Input
              type="password"
              value={oldPassword}
              onChange={(event) => setOldPassword(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{text.newPassword}</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{text.confirmPassword}</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </div>
          {error ? (
            <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? text.submitting : text.submit}
          </Button>
        </form>
      </section>
    </main>
  );
}
