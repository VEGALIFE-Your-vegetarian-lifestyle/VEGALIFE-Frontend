const { chromium } = require("C:/Users/HONG MINH/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright");
const path = require("path");
(async () => {
  const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
  for (const [w, name] of [[1440, "desk"], [390, "phone"]]) {
    const page = await browser.newPage({ viewport: { width: w, height: 900 } });
    await page.goto("http://localhost:5174/ai-nutrition", { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(name, "overflow:", overflow, "scrollW:", await page.evaluate(() => document.documentElement.scrollWidth));
    await page.screenshot({ path: path.join(__dirname, `ai-${name}.png`), fullPage: true });
    await page.close();
  }
  await browser.close();
})();
