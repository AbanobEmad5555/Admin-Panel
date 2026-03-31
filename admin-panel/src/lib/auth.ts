export const ADMIN_TOKEN_KEY = "admin_token";
export const ADMIN_TOKEN_EVENT = "admin-token-change";
export const ADMIN_MUST_CHANGE_PASSWORD_COOKIE = "admin_must_change_password";
export const ADMIN_PERMISSIONS_STORAGE_KEY = "admin_permissions";
export const ADMIN_PROFILE_STORAGE_KEY = "admin_profile";

export const getAdminToken = () => {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(ADMIN_TOKEN_KEY);
};

export const setAdminToken = (token: string) => {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
  document.cookie = `${ADMIN_TOKEN_KEY}=${token}; path=/`;
  window.dispatchEvent(new Event(ADMIN_TOKEN_EVENT));
};

export const clearAdminToken = () => {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  clearAdminSessionMetadata();
  window.dispatchEvent(new Event(ADMIN_TOKEN_EVENT));
};

export const syncAdminTokenCookie = () => {
  if (typeof window === "undefined") {
    return;
  }
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (token) {
    document.cookie = `${ADMIN_TOKEN_KEY}=${token}; path=/`;
  } else {
    document.cookie = `${ADMIN_TOKEN_KEY}=; Max-Age=0; path=/`;
  }
};

export const clearAdminSessionMetadata = () => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(ADMIN_PERMISSIONS_STORAGE_KEY);
  localStorage.removeItem(ADMIN_PROFILE_STORAGE_KEY);
  document.cookie = `${ADMIN_TOKEN_KEY}=; Max-Age=0; path=/`;
  document.cookie = `${ADMIN_MUST_CHANGE_PASSWORD_COOKIE}=0; Max-Age=0; path=/`;
};

export const setAdminSessionMetadata = (profile: {
  mustChangePassword?: boolean;
  permissions?: string[];
}) => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    ADMIN_PERMISSIONS_STORAGE_KEY,
    JSON.stringify(profile.permissions ?? [])
  );
  document.cookie = `${ADMIN_MUST_CHANGE_PASSWORD_COOKIE}=${
    profile.mustChangePassword ? "1" : "0"
  }; path=/`;
};
