import { expect, test, type Page, type Route } from "@playwright/test";

const GENERIC = "משהו השתבש אצלנו. נסו שוב בעוד רגע.";
const OFFLINE = "אין חיבור לאינטרנט. בדקו את החיבור ונסו שוב.";

function fulfillJson(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

function elements(page: Page) {
  return {
    input: page.getByRole("textbox", { name: "נושא לבדיחה" }),
    create: page.getByRole("button", { name: "צרו לי בדיחה" }),
    retry: page.getByRole("button", { name: "נסו שוב" }),
    counter: page.locator("#topic-counter"),
  };
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("retries after a failure and shows the joke", async ({ page }) => {
  const topics: string[] = [];
  let calls = 0;
  await page.route("**/api/jokes", (route) => {
    topics.push(route.request().postDataJSON().topic);
    calls += 1;
    return calls === 1
      ? fulfillJson(
          route,
          { error: { code: "AI_UNAVAILABLE", message: "x", retryable: true } },
          503,
        )
      : fulfillJson(route, { joke: "בדיחה אחרי ניסיון חוזר" });
  });

  const { input, create, retry } = elements(page);
  await input.fill("חתולים");
  await create.click();
  await expect(page.getByText(GENERIC)).toBeVisible();

  await retry.click();
  await expect(page.getByText("בדיחה אחרי ניסיון חוזר")).toBeVisible();
  await expect(retry).toHaveCount(0);
  expect(topics).toEqual(["חתולים", "חתולים"]);
});

test("does not accept typing or pasting beyond 50 characters", async ({ page }) => {
  const { input, counter } = elements(page);

  await input.pressSequentially("א".repeat(55));
  await expect(input).toHaveValue("א".repeat(50));
  await expect(counter).toHaveText("50/50");

  // A paste inserts the whole text at once; emoji count as one character each.
  await input.fill("");
  await input.focus();
  await page.keyboard.insertText("😀".repeat(60));
  await expect(counter).toHaveText("50/50");
  await expect(input).toHaveValue("😀".repeat(50));
});

test("sends only one request while a joke is loading", async ({ page }) => {
  let calls = 0;
  let release!: () => void;
  const released = new Promise<void>((r) => (release = r));
  await page.route("**/api/jokes", async (route) => {
    calls += 1;
    await released;
    await fulfillJson(route, { joke: "בדיחה אחת" });
  });

  const { input, create } = elements(page);
  await input.fill("ים");
  await create.click();
  await expect(page.getByText("רגע, הבדיחה בדרך...")).toBeVisible();
  await expect(create).toBeDisabled();
  await create.click({ force: true });
  await input.press("Enter");

  release();
  await expect(page.getByText("בדיחה אחת")).toBeVisible();
  expect(calls).toBe(1);
});

test("shows a clear error offline and recovers with retry", async ({ page, context }) => {
  await page.route("**/api/jokes", (route) => fulfillJson(route, { joke: "חזרנו לרשת" }));
  const { create, retry } = elements(page);

  await context.setOffline(true);
  await create.click();
  await expect(page.getByText(OFFLINE)).toBeVisible();

  await context.setOffline(false);
  await retry.click();
  await expect(page.getByText("חזרנו לרשת")).toBeVisible();
});
