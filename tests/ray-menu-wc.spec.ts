import { test, expect } from "@playwright/test";

test.describe("Ray Menu Web Component", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the WC demo page
    await page.goto("/wc-demo.html");
  });

  test("should be hidden initially", async ({ page }) => {
    const menu = page.locator("ray-menu");
    await expect(menu).toBeAttached();

    // Check internal state or visual visibility if possible.
    // Since the Shadow DOM might be empty or hidden, we check if the container is present/visible.
    // Based on the code, the container is created only on render when open.
    // But let's check custom element property
    const isOpen = await menu.evaluate((el: any) => el.isOpen);
    expect(isOpen).toBe(false);
  });

  test("should open on right-click", async ({ page }) => {
    const demoBox = page.locator("#demo1");
    const menu = page.locator("ray-menu");

    // Right click on the demo box
    await demoBox.click({ button: "right" });

    // Check if open
    const isOpen = await menu.evaluate((el: any) => el.isOpen);
    expect(isOpen).toBe(true);

    // Check for Shadow DOM elements existence
    // .ray-menu-container should exist in shadow root
    // Note: Playwright handles shadow DOM piercing automatically for CSS selectors usually,
    // but sometimes explicit locator needed for deep shadow.
    // Let's rely on visual visibility or simple evaluation.

    // For manual shadow DOM check:
    const containerVisible = await menu.evaluate((el: HTMLElement) => {
      return !!el.shadowRoot?.querySelector(".ray-menu-container");
    });
    expect(containerVisible).toBe(true);
  });

  test("should select an item on click", async ({ page }) => {
    const demoBox = page.locator("#demo1");
    const menu = page.locator("ray-menu");

    // Open menu
    await demoBox.click({ button: "right" });

    // Wait for animation frame or slight delay if needed (though local should be fast)

    // Find the 'Copy' item.
    // In Shadow DOM, the labels have class .ray-menu-label and contain text.
    // Playwright locator piercing:
    const copyItem = menu.locator(".ray-menu-label", { hasText: "Copy" });

    await expect(copyItem).toBeVisible();

    // Click it
    await copyItem.click({ force: true });

    // Menu should close
    const isOpen = await menu.evaluate((el: any) => el.isOpen);
    expect(isOpen).toBe(false);

    // Initial check for log update in the demo page
    const log = page.locator("#log");
    await expect(log).toContainText("Selected: Copy");
  });

  test("should close on escape key", async ({ page }) => {
    const demoBox = page.locator("#demo1");
    const menu = page.locator("ray-menu");

    // Open menu
    await demoBox.click({ button: "right" });
    const isOpen = await menu.evaluate((el: any) => el.isOpen);
    expect(isOpen).toBe(true);

    // Press Escape
    await page.keyboard.press("Escape");

    // Menu should close
    const isClosed = await menu.evaluate((el: any) => !el.isOpen);
    expect(isClosed).toBe(true);
  });
});
