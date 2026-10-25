import type { Page, Route } from "@playwright/test";

export const GENERIC = "משהו השתבש אצלנו. נסו שוב בעוד רגע.";
export const UNSAFE = "על הנושא הזה לא נוכל לכתוב בדיחה. נסו נושא אחר.";
export const INVALID = "משהו השתבש. רעננו את הדף ונסו שוב.";
export const LOADING = "רגע, הבדיחה בדרך...";

export function fulfillJson(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

export function errorBody(code: string, retryable = true) {
  return { error: { code, message: "server text", retryable } };
}

// Replies with each body in turn; the last one repeats.
export async function mockJokes(page: Page, ...replies: [unknown, number?][]) {
  const topics: string[] = [];
  await page.route("**/api/jokes", (route) => {
    topics.push(route.request().postDataJSON().topic);
    const [body, status] = replies[Math.min(topics.length, replies.length) - 1];
    return fulfillJson(route, body, status);
  });
  return topics;
}

// Holds the API reply until release() is called, to look at the loading state.
export async function holdJokes(page: Page, body: unknown) {
  let release!: () => void;
  const released = new Promise<void>((r) => (release = r));
  await page.route("**/api/jokes", async (route) => {
    await released;
    await fulfillJson(route, body);
  });
  return () => release();
}

export function elements(page: Page) {
  return {
    input: page.getByRole("textbox", { name: "נושא לבדיחה" }),
    create: page.getByRole("button", { name: "צרו לי בדיחה" }),
    retry: page.getByRole("button", { name: "נסו שוב" }),
    resultTitle: page.getByRole("heading", { name: "הבדיחה שלכם" }),
  };
}
