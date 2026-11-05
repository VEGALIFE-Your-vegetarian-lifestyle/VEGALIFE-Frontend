const { chromium } = require("C:/Users/HONG MINH/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright");
const path = require("path");

(async () => {
  const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
  const file = "file:///" + path.join(__dirname, "account-shell.html").replace(/\\/g, "/");

  for (const [w, name] of [[1440, "desk"], [390, "phone"]]) {
    const page = await browser.newPage({ viewport: { width: w, height: 1000 } });
    await page.goto(file, { waitUntil: "networkidle" });
    await page.waitForTimeout(900);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(name, "overflow:", overflow, "scrollW:", await page.evaluate(() => document.documentElement.scrollWidth));
    await page.screenshot({ path: path.join(__dirname, `account-shell-${name}.png`), fullPage: true });

    if (name === "desk") {
      for (const tab of ["posts", "recipes", "plan", "profile"]) {
        await page.click(`.nav a[data-go="${tab}"]`);
        await page.waitForTimeout(250);
        await page.screenshot({ path: path.join(__dirname, `account-shell-${tab}.png`), fullPage: true });
      }
    }
    await page.close();
  }
  await browser.close();
})();
