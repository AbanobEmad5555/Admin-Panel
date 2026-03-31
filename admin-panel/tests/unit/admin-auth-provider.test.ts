import assert from "node:assert/strict";
import test from "node:test";
import { ADMIN_PROFILE_STORAGE_KEY, ADMIN_TOKEN_KEY, syncAdminTokenCookie } from "@/lib/auth";

test("admin bootstrap starts in loading mode when a token exists, even with stale cached profile", async () => {
  const originalWindow = globalThis.window;
  const storage = new Map<string, string>();

  const localStorage = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storage.set(key, value);
    },
    removeItem: (key: string) => {
      storage.delete(key);
    },
    clear: () => {
      storage.clear();
    },
    key: (index: number) => Array.from(storage.keys())[index] ?? null,
    get length() {
      return storage.size;
    },
  };

  const fakeWindow = {
    localStorage,
  } as unknown as Window & typeof globalThis;

  storage.set(ADMIN_TOKEN_KEY, "token");
  storage.set(
    ADMIN_PROFILE_STORAGE_KEY,
    JSON.stringify({
      permissions: [],
      navigation: { routes: [] },
    })
  );

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: fakeWindow,
  });
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: localStorage,
  });

  try {
    const mod = await import("@/features/admin-auth/AdminAuthProvider");
    assert.equal(mod.__testing.shouldBootstrapAdminAuth(), true);
  } finally {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
    Reflect.deleteProperty(globalThis, "localStorage");
  }
});

test("syncAdminTokenCookie does not emit token-change events during steady-state sync", () => {
  const originalWindow = globalThis.window;
  const storage = new Map<string, string>();
  let dispatched = 0;

  const localStorage = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storage.set(key, value);
    },
    removeItem: (key: string) => {
      storage.delete(key);
    },
  };

  const fakeWindow = {
    localStorage,
    dispatchEvent: () => {
      dispatched += 1;
      return true;
    },
  } as unknown as Window & typeof globalThis;

  storage.set(ADMIN_TOKEN_KEY, "token");

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: fakeWindow,
  });
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: localStorage,
  });
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: { cookie: "" },
  });

  try {
    syncAdminTokenCookie();
    assert.equal(dispatched, 0);
  } finally {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
    Reflect.deleteProperty(globalThis, "localStorage");
    Reflect.deleteProperty(globalThis, "document");
  }
});
