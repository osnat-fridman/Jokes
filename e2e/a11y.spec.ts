import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import {
  GENERIC,
  INVALID,
  LOADING,
  UNSAFE,
  elements,
  errorBody,
  holdJokes,
  mockJokes,
} from "./helpers";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function expectNoViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  const summary = violations.map(
    (v) => `${v.id}: ${v.nodes.map((n) => n.failureSummary).join(" | ")}`,
  );
  expect(summary).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test.describe("axe finds no WCAG 2.2 AA issues", () => {
  test("initial screen", async ({ page }) => {
    await expectNoViolations(page);
  });

  test("loading", async ({ page }) => {
    const release = await holdJokes(page, { joke: "בדיחה" });
    await elements(page).create.click();
    await expect(page.getByText(LOADING)).toBeVisible();
    await expectNoViolations(page);
    release();
  });

  test("joke shown", async ({ page }) => {
    await mockJokes(page, [{ joke: "בדיחה על חתולים" }]);
    await elements(page).create.click();
    await expect(page.getByText("בדיחה על חתולים")).toBeVisible();
    await expectNoViolations(page);
  });

  test("unsafe topic under the field", async ({ page }) => {
    await mockJokes(page, [errorBody("UNSAFE_TOPIC", false), 422]);
    await elements(page).create.click();
    await expect(page.getByText(UNSAFE)).toBeVisible();
    await expectNoViolations(page);
  });

  test("error with retry", async ({ page }) => {
    await mockJokes(page, [errorBody("AI_UNAVAILABLE"), 503]);
    await elements(page).create.click();
    await expect(elements(page).retry).toBeVisible();
    await expectNoViolations(page);
  });

  test("error without retry", async ({ page }) => {
    await mockJokes(page, [errorBody("INVALID_REQUEST", false), 400]);
    await elements(page).create.click();
    await expect(page.getByText(INVALID)).toBeVisible();
    await expectNoViolations(page);
  });
});

test("the whole flow works with the keyboard only", async ({ page }) => {
  const topics = await mockJokes(
    page,
    [errorBody("AI_UNAVAILABLE"), 503],
    [{ joke: "בדיחה מהמקלדת" }],
  );
  const { input, create, retry, resultTitle } = elements(page);

  await page.keyboard.press("Tab");
  await expect(input).toBeFocused();
  await page.keyboard.type("ים");
  await page.keyboard.press("Tab");
  await expect(create).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(page.getByText(GENERIC)).toBeVisible();
  // Focus stays on the button; the message is announced, not focused.
  await expect(create).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(retry).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(page.getByText("בדיחה מהמקלדת")).toBeVisible();
  await expect(resultTitle).toBeFocused();
  // Shift+Tab goes back up to the main button.
  await page.keyboard.press("Shift+Tab");
  await expect(create).toBeFocused();
  expect(topics).toEqual(["ים", "ים"]);
});

test("loading, joke and errors are announced through live regions", async ({ page }) => {
  const live = (text: string) => page.locator("[aria-live]", { hasText: text });

  const release = await holdJokes(page, { joke: "בדיחה מוכרזת" });
  await elements(page).create.click();
  await expect(live(LOADING)).toHaveCount(1);
  release();
  await expect(live("בדיחה מוכרזת")).toHaveCount(1);

  await page.unroute("**/api/jokes");
  await mockJokes(page, [errorBody("UNSAFE_TOPIC", false), 422]);
  await elements(page).create.click();
  await expect(live(UNSAFE)).toHaveCount(1);

  await page.unroute("**/api/jokes");
  await mockJokes(page, [errorBody("AI_UNAVAILABLE"), 503]);
  await elements(page).input.fill("ים");
  await elements(page).create.click();
  await expect(live(GENERIC)).toHaveCount(1);
});

test("interactive targets are at least 44px high", async ({ page }) => {
  await mockJokes(page, [errorBody("AI_UNAVAILABLE"), 503]);
  const { input, create, retry } = elements(page);
  await create.click();
  await expect(retry).toBeVisible();
  for (const target of [input, create, retry]) {
    const box = (await target.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.width).toBeGreaterThanOrEqual(44);
  }
});
