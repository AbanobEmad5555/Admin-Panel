import type { Locator, Page } from "@playwright/test";

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const fieldByLabel = (page: Page, label: string): Locator =>
  page
    .locator("label")
    .filter({ hasText: new RegExp(`^${escapeRegExp(label)}(?:\\s*\\*)?$`) })
    .locator("xpath=following-sibling::*[1]");
