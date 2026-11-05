const { chromium } = require("C:/Users/HONG MINH/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright");
const path = require("path");
const ok = (data) => JSON.stringify({ success: true, message: "ok", data });
const PROFILE = { id: "pf1", userId: "u1", username: "minh.hong", email: "minh.hong@vegalife.vn", heightCm: 165, weightKg: 61, bmi: 22.4, age: 26, gender: "female", description: "x", avatarUrl: null, updatedAt: "2026-10-24T08:00:00", preferences: ["cay"], healthGoal: "g" };
const POSTS = { content: [], page: 0, size: 6, totalElements: 0, totalPages: 1 };

(async () => {
  const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  await ctx.addInitScript(() => {
    localStorage.setItem("vegalife_auth_persistent", JSON.stringify({
      user: { id: "u1", username: "minh.hong", email: "m@v.vn", role: "USER", status: "activated" },
      accessToken: "fake", refreshToken: "fake-refresh", expiresAt: Date.now() + 86400000,
    }));
  });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log("PAGEERROR", String(e)));
  page.on("console", (m) => console.log("CONSOLE", m.type(), m.text().slice(0, 300)));
  await page.route("**/api/**", (route) => {
    const url = route.request().url();
    let body = ok(null);
    if (url.includes("/api/posts")) body = ok(POSTS);
    else if (url.includes("/api/recipes/me")) body = ok([]);
    else if (url.includes("/api/menus/details")) body = ok([]);
    else if (url.includes("/api/profile")) body = ok(PROFILE);
    route.fulfill({ status: 200, contentType: "application/json", body });
  });

  await page.goto("http://localhost:5174/account", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  console.log("URL", page.url());
  console.log("BODY LEN", (await page.evaluate(() => document.body.innerText)).length);
  console.log((await page.evaluate(() => document.body.innerText)).slice(0, 800));
  await page.screenshot({ path: path.join(__dirname, "dbg.png") });
  await browser.close();
})();
