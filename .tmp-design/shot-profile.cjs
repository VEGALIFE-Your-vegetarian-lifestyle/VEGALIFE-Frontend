const { chromium } = require("C:/Users/HONG MINH/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright");
const path = require("path");
(async () => {
  const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto("file:///" + path.join(__dirname, "profile.html").replace(/\\/g, "/"), { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  console.log("overflow:", overflow, "scrollW:", await page.evaluate(() => document.documentElement.scrollWidth));
  await page.screenshot({ path: path.join(__dirname, "profile-shot.png"), fullPage: true });
  await browser.close();
})();
