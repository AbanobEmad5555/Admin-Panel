import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";

const requestFor = (pathname: string, cookie = "") =>
  new NextRequest(`http://localhost${pathname}`, {
    headers: cookie ? { cookie } : {},
  });

const locationPath = (location: string | null) => {
  if (!location) {
    return null;
  }
  const url = new URL(location);
  return `${url.pathname}${url.search}`;
};

test("public routes bypass auth redirects", () => {
  const response = middleware(requestFor("/login"));
  assert.equal(response.headers.get("location"), null);
});

test("protected routes redirect to login and preserve the requested path", () => {
  const response = middleware(requestFor("/admin/team"));
  assert.equal(locationPath(response.headers.get("location")), "/login?redirect=%2Fadmin%2Fteam");
});

test("forced password change blocks normal admin routes until resolved", () => {
  const response = middleware(
    requestFor("/admin/team", "admin_token=test-token; admin_must_change_password=1")
  );
  assert.equal(locationPath(response.headers.get("location")), "/admin/change-password");
});

test("resolved accounts are redirected away from the forced password screen", () => {
  const response = middleware(
    requestFor("/admin/change-password", "admin_token=test-token; admin_must_change_password=0")
  );
  assert.equal(locationPath(response.headers.get("location")), "/");
});

test("authenticated access continues normally when session cookies are valid", () => {
  const response = middleware(requestFor("/admin/team", "admin_token=test-token"));
  assert.equal(response.headers.get("location"), null);
});
