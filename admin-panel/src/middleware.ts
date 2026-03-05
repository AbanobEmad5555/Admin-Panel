import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login"];

const getRoleFromToken = (token: string) => {
  try {
    const [, payloadPart] = token.split(".");
    if (!payloadPart) {
      return null;
    }

    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const payload = JSON.parse(atob(padded)) as Record<string, unknown>;
    const nested = (payload.data ?? null) as Record<string, unknown> | null;
    const role = payload.role ?? payload.userRole ?? nested?.role;
    if (typeof role !== "string") {
      return null;
    }
    return role.toUpperCase();
  } catch {
    return null;
  }
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get("admin_token")?.value;
  if (!token) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/calendar" || pathname.startsWith("/calendar/")) {
    const role = getRoleFromToken(token);
    if (role !== "ADMIN") {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = "/dashboard";
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
