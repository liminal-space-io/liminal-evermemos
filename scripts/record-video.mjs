/**
 * Records the Liminal × EverMemOS POC auto-play as a .webm video.
 *
 * Usage:  node scripts/record-video.mjs
 * Output: LIMINAL_EVERMEMOS_VIDEO.webm (in project root)
 */

import { chromium } from 'playwright';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { rename } from 'fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const POC = `file://${resolve(ROOT, 'LIMINAL_EVERMEMOS_POC.html')}`;
const OUTPUT = resolve(ROOT, 'LIMINAL_EVERMEMOS_VIDEO.webm');

async function main() {
  console.log('🎬  Launching browser…');

  const browser = await chromium.launch({ headless: true });

  // 1080p recording context
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: resolve(ROOT, '.video-tmp'),
      size: { width: 1920, height: 1080 },
    },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  console.log('📄  Loading POC…');
  await page.goto(POC, { waitUntil: 'networkidle' });

  // Let initial animations settle
  await page.waitForTimeout(1500);

  console.log('▶️   Starting auto-play (press V)…');
  await page.keyboard.press('v');

  // The video mode runs ~90 seconds. Wait 93s to include the fade-out.
  const TOTAL_WAIT = 93_000;
  const start = Date.now();

  // Progress logging
  const interval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - start) / 1000);
    const pct = Math.min(100, Math.floor((elapsed / 90) * 100));
    process.stdout.write(`\r⏱   Recording… ${elapsed}s / 90s (${pct}%)`);
  }, 2000);

  await page.waitForTimeout(TOTAL_WAIT);
  clearInterval(interval);
  console.log('\n✅  Auto-play complete.');

  // Close to flush the video
  await page.close();
  const videoPath = await page.video().path();

  await context.close();
  await browser.close();

  // Move to final output path
  await rename(videoPath, OUTPUT);
  console.log(`🎬  Video saved: ${OUTPUT}`);

  // Cleanup temp dir
  const { rm } = await import('fs/promises');
  await rm(resolve(ROOT, '.video-tmp'), { recursive: true, force: true }).catch(() => {});
}

main().catch(err => {
  console.error('Recording failed:', err);
  process.exit(1);
});
