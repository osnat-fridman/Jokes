import { expect, test, type Page } from "@playwright/test";
import { elements, mockJokes } from "./helpers";

async function horizontalOverflow(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
}

for (const width of [320, 375, 768, 1280]) {
  test(`no horizontal scroll and a centered 480px column at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    expect(await horizontalOverflow(page)).toBe(0);

    const main = (await page.locator("main").boundingBox())!;
    expect(main.width).toBeLessThanOrEqual(480);
    // Centered: equal space on both sides (within a pixel).
    expect(Math.abs(main.x - (width - main.x - main.width))).toBeLessThanOrEqual(1);
  });
}

test("a long joke grows the card and the page scrolls vertically only", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  const longJoke = `${"בדיחה ארוכה מאוד שממשיכה ".repeat(30)}${"מילהארוכהבליר".repeat(8)}`;
  await mockJokes(page, [{ joke: longJoke }]);
  await page.goto("/");
  await elements(page).create.click();
  const joke = page.getByText("בדיחה ארוכה מאוד", { exact: false });
  await expect(joke).toBeVisible();

  expect(await horizontalOverflow(page)).toBe(0);
  const scrollable = await page.evaluate(
    () => document.documentElement.scrollHeight > window.innerHeight,
  );
  expect(scrollable).toBe(true);
  // The whole joke fits inside its card.
  const card = (await joke.locator("xpath=../..").boundingBox())!;
  const text = (await joke.boundingBox())!;
  expect(text.y + text.height).toBeLessThanOrEqual(card.y + card.height);
});

test("text spacing overrides (WCAG 1.4.12) do not clip or overflow", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");
  await page.addStyleTag({
    content: `* { line-height: 1.5 !important; letter-spacing: 0.12em !important;
      word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }`,
  });
  expect(await horizontalOverflow(page)).toBe(0);

  const clipped = await page.evaluate(() =>
    [...document.querySelectorAll("h1, h2, label, p, button")]
      .filter((el) => el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)
      .map((el) => el.textContent),
  );
  expect(clipped).toEqual([]);
});

test("200% zoom on a 640px window reflows without horizontal scroll", async ({ page }) => {
  // Doubles every size, so the page lays out in 320 CSS pixels of space.
  await page.setViewportSize({ width: 640, height: 800 });
  await page.goto("/");
  await page.addStyleTag({ content: "html { zoom: 2; }" });
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
});

test("reduced motion turns off button transitions", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const duration = await elements(page).create.evaluate(
    (el) => getComputedStyle(el).transitionDuration,
  );
  expect(duration).toBe("0s");
});
