/*
 * Records a 16:9 demo video of the real app for the Whop listing.
 * Run: node scripts/record-demo.mjs  (dev server must be running)
 *
 * The viewport stays locked on the card while panel buttons are triggered
 * via DOM clicks — Playwright's locator.click() would auto-scroll the page
 * (the panel sits below the card at this viewport), which reads as jank on
 * camera. Headless recordings have no cursor, so the demo is the card
 * transforming in place. Prints DEMO_START/DEMO_END seconds for ffmpeg trim.
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = "http://localhost:3000/experiences/test";
const DIR = "screenshots/video";

await mkdir(DIR, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
  recordVideo: { dir: DIR, size: { width: 1920, height: 1080 } },
});
const t0 = Date.now();
const page = await context.newPage();
const mark = () => ((Date.now() - t0) / 1000).toFixed(2);

const pause = (ms) => page.waitForTimeout(ms);

// Click a real app button by its exact text without scrolling the viewport.
const tap = (label) =>
  page.evaluate((l) => {
    const btn = [...document.querySelectorAll("button")].find(
      (b) => b.textContent.trim() === l || b.textContent.startsWith(l),
    );
    if (!btn) throw new Error(`button not found: ${l}`);
    btn.click();
  }, label);

const swatch = (title) =>
  page.evaluate((t) => document.querySelector(`div[title="${t}"]`).click(), title);

/* ── Setup (trimmed out of the final cut) ── */
await page.goto(BASE, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await pause(1000);
await tap("⬜ Static Image"); // legs all visible, no animation timing issues
await pause(1800); // long settle so no leg-reveal transition bleeds into the cut

/* ── Demo sequence ── */
console.log("DEMO_START", mark());

await pause(1500);                                  // 1. hold default PostBlue card

await tap("Hex"); await pause(800);                 // 2. hex pattern
await tap("Neon"); await pause(1100);               // 3. neon border glow

for (const t of ["Volt", "Fire", "Ice"]) {          // 4. theme tour
  await swatch(t); await pause(1000);
}
await swatch("PostBlue"); await pause(900);         // 5. back to PostBlue

for (const f of ["Square", "Portrait", "Landscape"]) { // 6. format reshapes
  await tap(f); await pause(1000);
}
await tap("Vertical"); await pause(1000);           // 7. back to vertical

await tap("Single Bet"); await pause(1200);
await tap("Parlay"); await pause(900);

await tap("3 Legs"); await pause(800);              // 8. leg counts
await tap("8 Legs"); await pause(900);
await tap("5 Legs"); await pause(800);

await tap("▶ Video"); await pause(600);             // 9. video mode
await tap("▶ Play");                                //    legs animate in
await pause(3800);                                  //    full smooth animation

await pause(2000);                                  // 10. hold finished card

console.log("DEMO_END", mark());

await context.close(); // flushes the video file
const path = await page.video().path();
await browser.close();
console.log("VIDEO", path);
