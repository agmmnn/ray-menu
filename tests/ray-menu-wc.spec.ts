import { test, expect } from "@playwright/test";

test.describe("Ray Menu Web Component", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should be hidden initially", async ({ page }) => {
    const menu = page.locator("ray-menu#menu");
    await expect(menu).toBeAttached();

    const isOpen = await menu.evaluate((el: any) => el.isOpen);
    expect(isOpen).toBe(false);
  });

  test("should open on right-click", async ({ page }) => {
    const demoBox = page.locator("#demo1");
    const menu = page.locator("ray-menu#menu");

    await demoBox.click({ button: "right" });

    const isOpen = await menu.evaluate((el: any) => el.isOpen);
    expect(isOpen).toBe(true);

    const containerVisible = await menu.evaluate((el: HTMLElement) => {
      return !!el.shadowRoot?.querySelector(".ray-menu-container");
    });
    expect(containerVisible).toBe(true);
  });

  test("should select an item on click", async ({ page }) => {
    const demoBox = page.locator("#demo1");
    const menu = page.locator("ray-menu#menu");

    await demoBox.click({ button: "right" });

    const copyItem = menu.locator(".ray-menu-label", { hasText: "Copy" });
    await expect(copyItem).toBeVisible();

    await copyItem.click({ force: true });

    // Wait for close animation
    await page.waitForTimeout(300);

    const isOpen = await menu.evaluate((el: any) => el.isOpen);
    expect(isOpen).toBe(false);

    const log = page.locator("#log");
    await expect(log).toContainText("Selected: Copy");
  });

  test("should close on escape key", async ({ page }) => {
    const demoBox = page.locator("#demo1");
    const menu = page.locator("ray-menu#menu");

    await demoBox.click({ button: "right" });
    const isOpen = await menu.evaluate((el: any) => el.isOpen);
    expect(isOpen).toBe(true);

    await page.keyboard.press("Escape");

    // Wait for close animation
    await page.waitForTimeout(300);

    const isClosed = await menu.evaluate((el: any) => !el.isOpen);
    expect(isClosed).toBe(true);
  });

  test("should have ARIA roles on menu container", async ({ page }) => {
    const demoBox = page.locator("#demo1");
    const menu = page.locator("ray-menu#menu");

    await demoBox.click({ button: "right" });

    const hasMenuRole = await menu.evaluate((el: HTMLElement) => {
      const container = el.shadowRoot?.querySelector(".ray-menu-container");
      return container?.getAttribute("role") === "menu";
    });
    expect(hasMenuRole).toBe(true);
  });

  test("should have menuitem roles on labels", async ({ page }) => {
    const demoBox = page.locator("#demo1");
    const menu = page.locator("ray-menu#menu");

    await demoBox.click({ button: "right" });

    const allMenuItems = await menu.evaluate((el: HTMLElement) => {
      const labels = el.shadowRoot?.querySelectorAll(".ray-menu-label");
      return Array.from(labels || []).every(
        (l) => l.getAttribute("role") === "menuitem",
      );
    });
    expect(allMenuItems).toBe(true);
  });
});
