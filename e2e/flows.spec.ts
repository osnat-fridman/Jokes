import { expect, test } from "@playwright/test";
import { UNSAFE, elements, errorBody, mockJokes } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("creates a joke for a topic", async ({ page }) => {
  const topics = await mockJokes(page, [{ joke: "בדיחה על חתולים" }]);
  const { input, create } = elements(page);
  await input.fill("חתולים");
  await create.click();
  await expect(page.getByText("בדיחה על חתולים")).toBeVisible();
  expect(topics).toEqual(["חתולים"]);
});

test("creates a general joke when the field is empty", async ({ page }) => {
  const topics = await mockJokes(page, [{ joke: "בדיחה כללית" }]);
  await elements(page).create.click();
  await expect(page.getByText("בדיחה כללית")).toBeVisible();
  expect(topics).toEqual([""]);
});

test("creates another joke after changing the topic", async ({ page }) => {
  const topics = await mockJokes(page, [{ joke: "בדיחה ראשונה" }], [{ joke: "בדיחה שנייה" }]);
  const { input, create } = elements(page);
  await input.fill("ים");
  await create.click();
  await expect(page.getByText("בדיחה ראשונה")).toBeVisible();

  await input.fill("יום שני");
  await create.click();
  await expect(page.getByText("בדיחה שנייה")).toBeVisible();
  await expect(page.getByText("בדיחה ראשונה")).toHaveCount(0);
  expect(topics).toEqual(["ים", "יום שני"]);
});

test("shows an unsafe topic under the field and clears it on edit", async ({ page }) => {
  await mockJokes(page, [errorBody("UNSAFE_TOPIC", false), 422]);
  const { input, create, retry } = elements(page);
  await input.fill("נושא");
  await create.click();
  await expect(page.getByText(UNSAFE)).toBeVisible();
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect(retry).toHaveCount(0);

  await input.fill("נושא אחר");
  await expect(page.getByText(UNSAFE)).toHaveCount(0);
});
