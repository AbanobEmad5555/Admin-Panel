import type { Page } from "@playwright/test";
import { fieldByLabel } from "./form";

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  await fieldByLabel(page, "Email").fill(email);
  await fieldByLabel(page, "Password").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
}
