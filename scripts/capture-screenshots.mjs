/*
 * Captures real App Store screenshots by driving the live builder at
 * http://localhost:3000/experiences/test with headless Chromium.
 * Run: node scripts/capture-screenshots.mjs   (dev server must be running)
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = "http://localhost:3000/experiences/test";
const OUT = "screenshots";

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1600, height: 1000 },
  deviceScaleFactor: 2,
  acceptDownloads: true,
});
const page = await context.newPage();

// Fonts must be fully loaded before any capture, then a settle delay so
// transitions (theme/format changes animate at ~.15-.4s) finish.
const settle = async (ms = 1000) => {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(ms);
};

const stage = page.locator("#stage");
const shotStage = (name) => stage.screenshot({ path: `${OUT}/${name}` });

console.log("Loading app...");
await page.goto(BASE, { waitUntil: "networkidle" });
await settle(1500);

/* ── Card configuration: Static Image mode, Hex pattern, Neon border ── */
await page.getByRole("button", { name: "Static Image" }).click();
await settle(300);
await page.getByRole("button", { name: "Hex", exact: true }).click();
await page.getByRole("button", { name: "Neon", exact: true }).click();
await settle();

/* 1. Full builder: card + control panel */
console.log("1/8 builder-full.png");
await page.screenshot({ path: `${OUT}/builder-full.png`, fullPage: true });

/* 2. Clean 9:16 card via Preview mode */
console.log("2/8 card-clean-9x16.png");
await page.getByRole("button", { name: "Preview", exact: false }).click();
await settle();
await shotStage("card-clean-9x16.png");
await page.getByRole("button", { name: "Exit Preview" }).click();
await settle(500);

/* 3. Theme variants (Hex + Neon stay applied) */
for (const theme of ["Volt", "Fire", "Ice"]) {
  console.log(`3/8 themes-${theme.toLowerCase()}.png`);
  await page.locator(`div[title="${theme}"]`).click();
  await settle(600);
  await shotStage(`themes-${theme.toLowerCase()}.png`);
}
await page.locator('div[title="PostBlue"]').click();
await settle(600);

/* 4. Single bet mode */
console.log("4/8 single-bet.png");
await page.getByRole("button", { name: "Single Bet" }).click();
await settle();
await shotStage("single-bet.png");
await page.getByRole("button", { name: "Parlay", exact: true }).click();
await settle();

/* 5. Output Type / Platform & Format panel section */
console.log("5/8 formats.png");
await page
  .locator(".panel-sec")
  .filter({ hasText: "Output Type" })
  .screenshot({ path: `${OUT}/formats.png` });

/* 6. Genuine app export via the real download pipeline */
console.log("6/8 real-output.png (real export, takes a few seconds)");
const downloadPromise = page.waitForEvent("download", { timeout: 120_000 });
await page.getByRole("button", { name: "Download PNG" }).click();
const download = await downloadPromise;
await download.saveAs(`${OUT}/real-output.png`);

await browser.close();
console.log("Done. All captures in " + OUT + "/");
