import { chromium } from "playwright";

const pages = [
  { url: "http://localhost:8080/", out: "landing.png" },
  { url: "http://localhost:8080/login", out: "login.png" },
  { url: "http://localhost:8080/register", out: "register.png" },
];

const browser = await chromium.launch();
const errors = [];
for (const p of pages) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`${p.url}: ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`${p.url}: ${err.message}`));
  await page.goto(p.url, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.screenshot({ path: p.out, fullPage: false });
  await page.close();
}
await browser.close();
console.log("DONE");
if (errors.length) {
  console.log("CONSOLE_ERRORS:");
  console.log(errors.join("\n"));
} else {
  console.log("NO_CONSOLE_ERRORS");
}
