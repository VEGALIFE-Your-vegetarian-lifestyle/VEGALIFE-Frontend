const { chromium } = require("C:/Users/HONG MINH/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright");
const path = require("path");
const ok = (data) => JSON.stringify({ success: true, message: "ok", data });
const POSTS = {
  content: [
    { id: "p1", title: "Phở chay nấm hương", content: "Nước dùng trong 4 tiếng nhờ rang gừng trước khi ninh.", status: "published", type: "post", viewCount: 412, createdAt: "2026-10-28T08:00:00", featuredImageUrl: null },
    { id: "p2", title: "Gỏi cuốn rau theo mùa", content: "Một đĩa gỏi cuốn không cần nước chấm mặn.", status: "created", type: "post", viewCount: 0, createdAt: "2026-10-26T08:00:00", featuredImageUrl: null },
  ],
  page: 0, size: 6, totalElements: 2, totalPages: 1,
};
const RECIPES = [
  { id: "r1", userId: "u1", dishId: "d1", dishName: "Bún chả", name: "Bún chả chay", description: null, instructions: "", prepTimeMinutes: 20, cookTimeMinutes: 25, servings: 2, difficulty: "MEDIUM", ingredients: [], moderationStatus: "PENDING", dishModerationStatus: "PENDING", calories: null, proteinG: null, carbohydrateG: null, fatG: null, fiberG: null, createdAt: "2026-10-29T08:00:00", updatedAt: "2026-10-29T08:00:00" },
];
const PROFILE = { id: "pf1", userId: "u1", username: "minh.hong", email: "minh.hong@vegalife.vn", heightCm: 165, weightKg: 61, bmi: 22.4, age: 26, gender: "female", description: "Nấu chay cho gia đình ba người.", avatarUrl: null, updatedAt: "2026-10-24T08:00:00", preferences: ["cay"], dislikes: [], allergies: [], restrictions: [], healthGoal: "Giảm 3 kg trong 3 tháng." };

(async () => {
  const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
  for (const [w, tag] of [[900, "tablet"], [390, "phone"]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 1000 } });
    await ctx.addInitScript(() => {
      localStorage.setItem("vegalife_auth_persistent", JSON.stringify({
        user: { id: "u1", username: "minh.hong", email: "m@v.vn", role: "USER", status: "activated" },
        accessToken: "fake", refreshToken: "fake-refresh", expiresAt: Date.now() + 86400000,
      }));
      localStorage.setItem("vegalife-language", "vi");
    });
    const page = await ctx.newPage();
    await page.route((url) => url.pathname.startsWith("/api/"), (route) => {
      const p = new URL(route.request().url()).pathname;
      let body = ok(null);
      if (p.startsWith("/api/posts")) body = ok(POSTS);
      else if (p === "/api/recipes/me") body = ok(RECIPES);
      else if (p === "/api/menus/details") body = ok([]);
      else if (p === "/api/profile") body = ok(PROFILE);
      route.fulfill({ status: 200, contentType: "application/json", body });
    });
    for (const route_ of ["/account", "/my-posts", "/recipes", "/profile", "/meal-plan"]) {
      await page.goto("http://localhost:5174" + route_, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1000);
      const sw = await page.evaluate(() => document.documentElement.scrollWidth);
      console.log(tag, route_, "scrollW:", sw, sw > w ? "OVERFLOW" : "ok");
      await page.screenshot({ path: path.join(__dirname, `${tag}${route_.replace(/\//g, "-")}.png`), fullPage: true });
    }
    await ctx.close();
  }
  await browser.close();
})();
