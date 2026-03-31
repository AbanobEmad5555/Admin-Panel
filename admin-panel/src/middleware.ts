import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/403"];

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

  const mustChangePassword = request.cookies.get("admin_must_change_password")?.value === "1";

  if (mustChangePassword && pathname !== "/admin/change-password") {
    const changePasswordUrl = request.nextUrl.clone();
    changePasswordUrl.pathname = "/admin/change-password";
    return NextResponse.redirect(changePasswordUrl);
  }

  if (!mustChangePassword && pathname === "/admin/change-password") {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
