import { expect, test } from "@playwright/test";

test("the manifest has the fields and icons from the architecture", async ({ page, request }) => {
  await page.goto("/");
  const href = await page.locator('link[rel="manifest"]').getAttribute("href");
  expect(href).toBeTruthy();

  const response = await request.get(href!);
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest).toMatchObject({
    name: "רגע של צחוק",
    short_name: "רגע של צחוק",
    lang: "he",
    dir: "rtl",
    start_url: "/",
    display: "standalone",
    theme_color: "#F47FA8",
    background_color: "#FFFDFB",
  });

  const sizes = manifest.icons.map((icon: { sizes: string }) => icon.sizes);
  expect(sizes).toEqual(expect.arrayContaining(["192x192", "512x512"]));
  for (const icon of manifest.icons) {
    const image = await request.get(icon.src);
    expect(image.ok()).toBe(true);
    expect(image.headers()["content-type"]).toBe("image/png");
  }
});

test("icons have the declared pixel sizes", async ({ page }) => {
  await page.goto("/");
  const appleHref = await page.locator('link[rel="apple-touch-icon"]').getAttribute("href");
  const checks: [string, number][] = [
    ["/icons/icon-192.png", 192],
    ["/icons/icon-512.png", 512],
    [appleHref!, 180],
  ];
  for (const [src, size] of checks) {
    const natural = await page.evaluate(async (url) => {
      const img = new Image();
      img.src = url;
      await img.decode();
      return [img.naturalWidth, img.naturalHeight];
    }, src);
    expect(natural, src).toEqual([size, size]);
  }
});

test("the page has install metadata and no service worker", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "he");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#F47FA8");
  await expect(page.locator('meta[name="mobile-web-app-capable"], meta[name="apple-mobile-web-app-capable"]').first()).toHaveAttribute("content", "yes");
  await expect(page.locator('meta[name="apple-mobile-web-app-title"]')).toHaveAttribute("content", "רגע של צחוק");
  expect((await request.get("/favicon.ico")).ok()).toBe(true);

  const registrations = await page.evaluate(async () =>
    (await navigator.serviceWorker.getRegistrations()).length,
  );
  expect(registrations).toBe(0);
});
