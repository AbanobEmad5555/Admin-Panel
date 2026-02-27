"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearAdminToken, getAdminToken } from "@/lib/auth";

export default function HomeAuthAction() {
  const router = useRouter();
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    setIsSignedIn(Boolean(getAdminToken()));
  }, []);

  const handleSignOut = () => {
    clearAdminToken();
    setIsSignedIn(false);
    router.replace("/login");
  };

  if (isSignedIn) {
    return (
      <button
        type="button"
        onClick={handleSignOut}
        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100"
      >
        Sign out
      </button>
    );
  }

  return (
    <Link
      href="/login"
      className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100"
    >
      Sign in
    </Link>
  );
}
