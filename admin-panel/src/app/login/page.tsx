"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import LanguageSwitcher from "@/modules/localization/components/LanguageSwitcher";
import { useLocalization } from "@/modules/localization/LocalizationProvider";
import api from "@/services/api";
import { setAdminToken } from "@/lib/auth";

type LoginResponse = {
  success: boolean;
  data: {
    token: string;
    role: string;
    status: string;
  };
  message?: string;
};

const copy = {
  en: {
    title: "Admin Login",
    subtitle: "Sign in with your admin credentials.",
    email: "Email",
    password: "Password",
    emailPlaceholder: "Enter email",
    passwordPlaceholder: "Enter password",
    signIn: "Sign In",
    signingIn: "Signing In...",
    missingToken: "Login failed. Missing token.",
    adminOnly: "Only admins can access this panel.",
    inactive: "Admin account is not active.",
    invalidCredentials: "Login failed. Check your credentials.",
  },
  ar: {
    title: "تسجيل دخول الإدارة",
    subtitle: "سجّل الدخول باستخدام بيانات اعتماد المسؤول.",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    emailPlaceholder: "أدخل البريد الإلكتروني",
    passwordPlaceholder: "أدخل كلمة المرور",
    signIn: "تسجيل الدخول",
    signingIn: "جارٍ تسجيل الدخول...",
    missingToken: "فشل تسجيل الدخول. لا يوجد رمز وصول.",
    adminOnly: "يسمح للمسؤولين فقط بالدخول إلى هذه اللوحة.",
    inactive: "حساب المسؤول غير نشط.",
    invalidCredentials: "فشل تسجيل الدخول. تحقق من بيانات الاعتماد.",
  },
} as const;

export default function LoginPage() {
  const router = useRouter();
  const { direction, language } = useLocalization();
  const text = copy[language];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await api.post<LoginResponse>("/api/auth/login", {
        email,
        password,
      });
      const token = response.data?.data?.token;
      const role = response.data?.data?.role;
      const status = response.data?.data?.status;

      if (!token) {
        setError(text.missingToken);
        return;
      }
      if (role !== "ADMIN") {
        setError(text.adminOnly);
        return;
      }
      if (status !== "ACTIVE") {
        setError(text.inactive);
        return;
      }

      setAdminToken(token);
      router.replace("/");
    } catch {
      setError(text.invalidCredentials);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-slate-100 px-4"
      dir={direction}
    >
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex justify-end">
          <LanguageSwitcher />
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">{text.title}</h1>
          <p className="text-sm text-slate-500">{text.subtitle}</p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{text.email}</label>
            <Input
              type="email"
              name="email"
              placeholder={text.emailPlaceholder}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{text.password}</label>
            <Input
              type="password"
              name="password"
              placeholder={text.passwordPlaceholder}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          {error ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? text.signingIn : text.signIn}
          </Button>
        </form>
      </div>
    </div>
  );
}
