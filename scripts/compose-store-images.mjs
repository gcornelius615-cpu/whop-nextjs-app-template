/*
 * Builds two 1920x1080 Whop App Store listing images in screenshots/store/.
 * UI pixels come from real captures of the running app (headless Chromium);
 * headline text is rasterized in the same browser so it uses the app's actual
 * Anton/Oswald Google Fonts; backgrounds, glow, and layout are composed with
 * sharp. Run: node scripts/compose-store-images.mjs (dev server must be up).
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const BASE = "http://localhost:3000/experiences/test";
const OUT = "screenshots/store";
const W = 1920, H = 1080;
const BG = "#06080B";
const ACCENT = "#2F64EE";

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1600, height: 1000 },
  deviceScaleFactor: 2,
});
const page = await context.newPage();

const settle = async (ms = 1000) => {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(ms);
};

/* ── 1. Capture real UI ── */
console.log("Capturing app UI...");
await page.goto(BASE, { waitUntil: "networkidle" });
await settle(1500);

await page.getByRole("button", { name: "Static Image" }).click();
await settle(300);
await page.getByRole("button", { name: "Hex", exact: true }).click();
await page.getByRole("button", { name: "Neon", exact: true }).click();
await settle();

await page.getByRole("button", { name: "Preview", exact: false }).click();
await settle();
const cardPng = await page.locator("#stage").screenshot();
await page.getByRole("button", { name: "Exit Preview" }).click();
await settle(500);

const editorPng = await page
  .locator(".panel-sec")
  .filter({ hasText: "Bet Type" })
  .screenshot();

/* ── 2. Rasterize headlines in the browser (real Anton/Oswald fonts) ── */
const textRaster = async (html) => {
  const tp = await context.newPage();
  await tp.setContent(`<!DOCTYPE html><html><head>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Anton&family=Oswald:wght@400;600&display=swap" rel="stylesheet">
    <style>body{margin:0;background:transparent}</style>
    </head><body><div id="txt" style="display:inline-block">${html}</div></body></html>`);
  await tp.evaluate(() => document.fonts.ready);
  await tp.waitForTimeout(800);
  const buf = await tp.locator("#txt").screenshot({ omitBackground: true });
  await tp.close();
  return buf;
};

const headline = (line1, line2pre, line2acc, subline, size) => `
  <div style="font-family:'Anton',sans-serif;color:#F4F7F2;font-size:${size}px;line-height:1.12;letter-spacing:2px;white-space:nowrap">${line1}</div>
  <div style="font-family:'Anton',sans-serif;color:#F4F7F2;font-size:${size}px;line-height:1.12;letter-spacing:2px;white-space:nowrap">${line2pre}<span style="color:${ACCENT}">${line2acc}</span></div>
  <div style="font-family:'Oswald',sans-serif;font-weight:400;font-size:${Math.round(size * 0.31)}px;color:#8a93a5;letter-spacing:1.5px;margin-top:26px;white-space:nowrap">${subline}</div>`;

console.log("Rendering headlines...");
const text1 = await textRaster(headline(
  "PRO PARLAY CARDS",
  "IN UNDER ", "60 SECONDS",
  "Branded picks content for TikTok, Reels, Shorts &amp; your community",
  86,
));
const text2 = await textRaster(headline(
  "FILL IN YOUR PICKS",
  "WE ", "BUILD",
  "2-8 legs &middot; every sport &middot; auto-calculated odds &amp; payouts",
  86,
).replace("</span>", "</span> THE CARD"));

await browser.close();

/* ── 3. Compose with sharp ── */
const glow = (cx, cy, rx, ry) => Buffer.from(`<svg width="${W}" height="${H}">
  <defs><radialGradient id="g" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="${ACCENT}" stop-opacity="0.40"/>
    <stop offset="55%" stop-color="${ACCENT}" stop-opacity="0.13"/>
    <stop offset="100%" stop-color="${ACCENT}" stop-opacity="0"/>
  </radialGradient></defs>
  <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#g)"/>
</svg>`);

const fit = async (buf, opts) => {
  const img = sharp(buf).resize({ ...opts, withoutEnlargement: true });
  const { data, info } = await img.png().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
};

const compose = async (file, { uiBuf, uiFit, textBuf, textWidth, glowCfg }) => {
  const ui = await fit(uiBuf, uiFit);
  const text = await fit(textBuf, { width: textWidth });
  const uiX = W - ui.w - 120;
  const uiY = Math.round((H - ui.h) / 2);
  const textX = 110;
  const textY = Math.round((H - text.h) / 2);
  await sharp({ create: { width: W, height: H, channels: 4, background: BG } })
    .composite([
      { input: glow(glowCfg.cx, glowCfg.cy, glowCfg.rx, glowCfg.ry), top: 0, left: 0 },
      { input: ui.data, top: uiY, left: uiX },
      { input: text.data, top: textY, left: textX },
    ])
    .png()
    .toFile(`${OUT}/${file}`);
  console.log(`${file}: card/ui ${ui.w}x${ui.h} at (${uiX},${uiY}), text ${text.w}x${text.h}`);
};

console.log("Composing...");
await compose("store-1-finished-card.png", {
  uiBuf: cardPng,
  uiFit: { height: 960 },
  textBuf: text1,
  textWidth: 880,
  glowCfg: { cx: 1390, cy: 540, rx: 720, ry: 640 },
});
await compose("store-2-builder.png", {
  uiBuf: editorPng,
  uiFit: { width: 1000, height: 960, fit: "inside" },
  textBuf: text2,
  textWidth: 700,
  glowCfg: { cx: 1330, cy: 540, rx: 760, ry: 620 },
});
console.log("Done.");
