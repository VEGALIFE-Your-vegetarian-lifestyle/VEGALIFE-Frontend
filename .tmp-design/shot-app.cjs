const { chromium } = require("C:/Users/HONG MINH/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright");
const path = require("path");

const ok = (data) => JSON.stringify({ success: true, message: "ok", data });

const POSTS = {
  content: [
    { id: "p1", title: "Phở chay nấm hương", content: "Nước dùng trong 4 tiếng nhờ rang gừng trước khi ninh.", status: "published", type: "post", viewCount: 412, createdAt: "2026-10-28T08:00:00", featuredImageUrl: null },
    { id: "p2", title: "Gỏi cuốn rau theo mùa", content: "Một đĩa gỏi cuốn không cần nước chấm mặn.", status: "created", type: "post", viewCount: 0, createdAt: "2026-10-26T08:00:00", featuredImageUrl: null },
    { id: "p3", title: "3 phút sơ chế đậu hũ non", content: "Chần qua nước muối loãng giúp miếng đậu chắc hơn.", status: "published", type: "video", viewCount: 188, createdAt: "2026-10-21T08:00:00", featuredImageUrl: null },
  ],
  page: 0, size: 6, totalElements: 3, totalPages: 1,
};

const RECIPES = [
  { id: "r1", userId: "u1", dishId: "d1", dishName: "Bún chả", name: "Bún chả chay", description: null, instructions: "", prepTimeMinutes: 20, cookTimeMinutes: 25, servings: 2, difficulty: "MEDIUM", ingredients: [], moderationStatus: "PENDING", dishModerationStatus: "PENDING", calories: null, proteinG: null, carbohydrateG: null, fatG: null, fiberG: null, createdAt: "2026-10-29T08:00:00", updatedAt: "2026-10-29T08:00:00" },
  { id: "r2", userId: "u1", dishId: "d2", dishName: "Canh", name: "Canh chua chay", description: null, instructions: "", prepTimeMinutes: 10, cookTimeMinutes: 15, servings: 3, difficulty: "EASY", ingredients: [], moderationStatus: "APPROVED", dishModerationStatus: "APPROVED", calories: null, proteinG: null, carbohydrateG: null, fatG: null, fiberG: null, createdAt: "2026-10-20T08:00:00", updatedAt: "2026-10-20T08:00:00" },
];

const MENUS = [
  { id: "m1", startDate: "2026-10-27", endDate: "2026-11-02", status: "drafted", notes: null, createdAt: "2026-10-27T08:00:00", updatedAt: "2026-10-27T08:00:00",
    days: [
      { date: "2026-10-27", meals: [{ mealType: "BREAKFAST", servings: 2, dish: { id: "d1", name: "X", description: null, imageUrl: null, cuisineType: null } }, { mealType: "LUNCH", servings: 2, dish: { id: "d2", name: "Y", description: null, imageUrl: null, cuisineType: null } }] },
      { date: "2026-10-29", meals: [{ mealType: "DINNER", servings: 2, dish: { id: "d1", name: "X", description: null, imageUrl: null, cuisineType: null } }] },
    ] },
];

const PROFILE = { id: "pf1", userId: "u1", username: "minh.hong", email: "minh.hong@vegalife.vn", heightCm: 165, weightKg: 61, bmi: 22.4, age: 26, gender: "female", description: "Nấu chay cho gia đình ba người.", avatarUrl: null, updatedAt: "2026-10-24T08:00:00", preferences: ["cay", "giàu đạm"], dislikes: ["ngò rí"], allergies: ["đậu phộng"], restrictions: ["không đường thêm"], healthGoal: "Giảm 3 kg trong 3 tháng, giữ đủ đạm cho buổi tập." };

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
    const url = route.request().url();
    let body = ok(null);
    if (url.includes("/api/posts")) body = ok(url.includes("/api/posts/feed") ? POSTS : POSTS);
    else if (url.includes("/api/recipes/me")) body = ok(RECIPES);
    else if (url.includes("/api/menus/details")) body = ok(MENUS);
    else if (url.includes("/api/profile")) body = ok(PROFILE);
    route.fulfill({ status: 200, contentType: "application/json", body });
  });

  const shots = [["/account", "overview"], ["/my-posts", "posts"], ["/recipes", "recipes"], ["/meal-plan", "plan"], ["/profile", "profile"]];
  for (const [route_, name] of shots) {
    await page.goto("http://localhost:5174" + route_, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(name, "url:", page.url().replace("http://localhost:5174", ""), "overflow:", overflow);
    await page.screenshot({ path: path.join(__dirname, `app-${name}.png`), fullPage: true });
  }

  const phone = await ctx.newPage();
  await phone.setViewportSize({ width: 390, height: 900 });
  await phone.goto("http://localhost:5174/account", { waitUntil: "domcontentloaded" });
  await phone.waitForTimeout(1200);
  console.log("phone overflow:", await phone.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), await phone.evaluate(() => document.documentElement.scrollWidth));
  await phone.screenshot({ path: path.join(__dirname, "app-phone.png"), fullPage: true });

  console.log("errors:", errors.slice(0, 6));
  await browser.close();
})();
