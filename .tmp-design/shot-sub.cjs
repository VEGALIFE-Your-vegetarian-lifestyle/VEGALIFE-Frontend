const { chromium } = require("C:/Users/HONG MINH/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright");
const path = require("path");
const ok = (data) => JSON.stringify({ success: true, message: "ok", data });
const PLANS = [
  { code: "FREE", name: "Miễn phí", price: { amount: 0, currency: "VND" }, monthlyRequestLimit: 20 },
  { code: "PLUS", name: "Plus", price: { amount: 59000, currency: "VND" }, monthlyRequestLimit: 500 },
];

(async () => {
  const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  await ctx.addInitScript(() => {
    localStorage.setItem("vegalife_auth_persistent", JSON.stringify({
      user: { id: "u1", username: "minh.hong", email: "minh.hong@vegalife.vn", role: "USER", status: "activated" },
      accessToken: "fake.token.value", refreshToken: "fake-refresh", expiresAt: Date.now() + 86400000,
    }));
    localStorage.setItem("vegalife-language", "vi");
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.route((url) => url.pathname.startsWith("/api/"), (route) => {
    const p = new URL(route.request().url()).pathname;
    let body = ok(null);
    if (p === "/api/subscription/plans" || p.endsWith("/plans")) body = ok(PLANS);
    else if (p.startsWith("/api/posts")) body = ok({ content: [], page: 0, size: 6, totalElements: 0, totalPages: 1 });
    else if (p === "/api/recipes/me") body = ok([]);
    else if (p === "/api/menus/details") body = ok([]);
    route.fulfill({ status: 200, contentType: "application/json", body });
  });

  for (const route of ["/account/subscription", "/subscription"]) {
    await page.goto("http://localhost:5173" + route, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);
    const hasRail = await page.locator('aside a[href="/account"]').count();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(route, "railLinks:", hasRail, "overflow:", overflow);
    await page.screenshot({ path: path.join(__dirname, "sub" + route.replace(/\//g, "-") + ".png"), fullPage: true });
  }

  const phone = await ctx.newPage();
  await phone.setViewportSize({ width: 390, height: 900 });
  await phone.goto("http://localhost:5173/account/subscription", { waitUntil: "domcontentloaded" });
  await phone.waitForTimeout(1200);
  console.log("phone scrollW:", await phone.evaluate(() => document.documentElement.scrollWidth));
  await phone.screenshot({ path: path.join(__dirname, "sub-phone.png"), fullPage: true });
  console.log("errors:", errors.slice(0, 5));
  await browser.close();
})();
