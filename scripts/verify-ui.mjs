#!/usr/bin/env node
/**
 * Automated Playwright UI Verification & Screenshot Suite for Flappy NeuroLab
 *
 * Usage:
 *   npm run verify:ui
 *   node scripts/verify-ui.mjs --url=http://127.0.0.1:3000 --out=.ui-screenshots
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const argUrl = args.find((a) => a.startsWith('--url='))?.split('=')[1];
const argOut = args.find((a) => a.startsWith('--out='))?.split('=')[1];
const outDir = path.resolve(process.cwd(), argOut || '.ui-screenshots');

async function isReachable(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch {
    return false;
  }
}

async function waitForServer(url, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isReachable(url)) return true;
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
}

function startPreviewServer(port) {
  const distExists = fs.existsSync(path.resolve(process.cwd(), 'dist/index.html'));
  const cmdArgs = distExists
    ? ['vite', 'preview', '--port', String(port), '--host', '127.0.0.1', '--strictPort']
    : ['vite', '--port', String(port), '--host', '127.0.0.1', '--strictPort'];
  return spawn('npx', cmdArgs, {
    cwd: process.cwd(),
    stdio: 'pipe',
    detached: true,
    env: { ...process.env, BROWSER: 'none' },
  });
}

async function snap(page, fileName) {
  await page.screenshot({
    path: path.join(outDir, fileName),
    fullPage: false,
    animations: 'allow',
    timeout: 8000,
  });
}

async function run() {
  fs.mkdirSync(outDir, { recursive: true });

  let targetUrl = argUrl;
  let spawnedProc = null;

  if (!targetUrl) {
    if (await isReachable('http://127.0.0.1:3000')) {
      targetUrl = 'http://127.0.0.1:3000';
    } else {
      const previewPort = 4173;
      targetUrl = `http://127.0.0.1:${previewPort}`;
      console.log(`[verify:ui] Starting temporary local server on ${targetUrl}...`);
      spawnedProc = startPreviewServer(previewPort);
      const ready = await waitForServer(targetUrl, 25000);
      if (!ready) {
        if (spawnedProc.pid) process.kill(-spawnedProc.pid, 'SIGTERM');
        throw new Error(`Server failed to become ready at ${targetUrl}`);
      }
    }
  }

  let browser;
  const pageErrors = [];
  const consoleErrors = [];
  const findings = [];

  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });

    const context = await browser.newContext({
      viewport: { width: 1440, height: 960 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    page.setDefaultTimeout(6000);

    page.on('pageerror', (err) => pageErrors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('WebSocket') && !text.includes('WebGPU')) {
          consoleErrors.push(text);
        }
      }
    });

    console.log(`[verify:ui] Opening ${targetUrl}`);
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('header nav');
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('canvas');
    await page.waitForTimeout(700);

    // 1. Desktop Training Lab (Polish default)
    console.log('[verify:ui] Step 1: Training Lab desktop (PL)');
    const overflowDesktop = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    );
    findings.push(`desktop_overflow_px=${overflowDesktop}`);
    await snap(page, '01-training-desktop-pl.png');

    // Verify TopBar flag language button switches PL -> EN and back
    const langBtnSelector = 'header button[title*="English"], header button[title*="polski"]';
    const textBefore = (await page.locator(langBtnSelector).first().innerText()).trim();
    await page.locator(langBtnSelector).first().click({ force: true });
    await page.waitForTimeout(200);
    const textAfterEn = (await page.locator(langBtnSelector).first().innerText()).trim();
    const navTextEn = await page.locator('header nav').innerText();
    findings.push(
      `lang_toggle=${textBefore}->${textAfterEn}(EN_nav=${navTextEn.includes('Training Lab')})`
    );
    await page.locator(langBtnSelector).first().click({ force: true });
    await page.waitForTimeout(200);

    // 2. Switch to 16-Ray Compound-Eye Retina + Hyperparameters panel
    console.log('[verify:ui] Step 2: 16-Ray Retina mode');
    const paramsTab = page.getByRole('button', { name: /Ustawienia & Fizyka|Hyperparameters/i }).first();
    await paramsTab.click({ force: true });
    await page.waitForTimeout(200);

    const retinaBtn = page
      .getByRole('button', {
        name: /^(Oko Złożone 16-Ray \(Piksele\)|Compound-Eye Pixels)$/i,
      })
      .first();
    await retinaBtn.click({ force: true });
    await page.waitForTimeout(900);
    await page.evaluate(() => {
      const c = document.querySelector('canvas');
      if (c) c.scrollIntoView({ block: 'center' });
    });
    await page.waitForTimeout(300);
    await snap(page, '02-training-16ray-retina.png');

    // 3. Switch to Arena Live + switch language to EN to verify English UI + Polish flag icon
    console.log('[verify:ui] Step 3: Arena Live (EN)');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator(langBtnSelector).first().click({ force: true });
    await page.waitForTimeout(200);
    const arenaBtn = page.getByRole('button', { name: /Live Arena|Arena Na Żywo/i }).first();
    await arenaBtn.click({ force: true });
    await page.waitForTimeout(1100);
    await page.evaluate(() => {
      const c = document.querySelector('canvas');
      if (c) c.scrollIntoView({ block: 'center' });
    });
    await page.waitForTimeout(300);
    await snap(page, '03-training-arena-en.png');

    // 4. Play vs. AI view
    console.log('[verify:ui] Step 4: Play vs. AI');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator('header nav').getByRole('button', { name: /Play vs\. AI|Gra vs AI/i }).first().click({ force: true });
    await page.waitForTimeout(450);
    await snap(page, '04-play-vs-ai.png');

    // 5. Research Sweep (NeuroLab) — start, pause, inspect metrics & stop
    console.log('[verify:ui] Step 5: Research Sweep + Pause');
    await page.locator('header nav').getByRole('button', { name: /Research Sweep|Badania/i }).first().click({ force: true });
    await page.waitForTimeout(450);
    await snap(page, '05-research-sweep.png');

    const runSweepBtn = page
      .locator('section')
      .getByRole('button', { name: /Run \(|Uruchom \(|Continue|Kontynuuj/i })
      .first();
    if (await runSweepBtn.isVisible().catch(() => false)) {
      await runSweepBtn.click({ force: true });
      await page.waitForTimeout(1400);
      const pauseBtn = page.getByRole('button', { name: /Pause Sweep|Wstrzymaj|Pause/i }).first();
      if (await pauseBtn.isVisible().catch(() => false)) {
        await pauseBtn.click({ force: true });
        await page.waitForTimeout(500);
        const bodyText = await page.locator('section').first().innerText();
        findings.push(
          `sweep_paused_badge=${bodyText.includes('PAUSED') || bodyText.includes('PAUZA')}`
        );
      }
      await snap(page, '06-research-paused.png');
      const stopBtn = page.getByRole('button', { name: /^Stop$/i }).first();
      if (await stopBtn.isVisible().catch(() => false)) {
        await stopBtn.click({ force: true });
        await page.waitForTimeout(250);
      }
    }

    // 6. Documentation View
    console.log('[verify:ui] Step 6: Documentation view');
    await page.locator('header nav').getByRole('button', { name: /Documentation|Dokumentacja/i }).first().click({ force: true });
    await page.waitForTimeout(350);
    await snap(page, '07-docs-view.png');

    // 7. Mobile viewport (390x844) back on Training Lab
    console.log('[verify:ui] Step 7: Mobile 390x844');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('header nav').getByRole('button', { name: /Training Lab|Laboratorium Treningu/i }).first().click({ force: true });
    await page.waitForTimeout(650);
    const overflowMobile = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    );
    findings.push(`mobile_overflow_px=${overflowMobile}`);
    await snap(page, '08-mobile-training.png');

    console.log('[verify:ui] Checks:', findings.join(' | '));
    console.log(`[verify:ui] Screenshots saved to: ${outDir}`);
    if (pageErrors.length > 0 || consoleErrors.length > 0) {
      console.error('[verify:ui] Errors detected:', { pageErrors, consoleErrors });
      process.exitCode = 1;
    }
    if (overflowDesktop > 4 || overflowMobile > 4) {
      console.error('[verify:ui] Horizontal overflow detected!');
      process.exitCode = 1;
    }
  } finally {
    if (browser) await browser.close();
    if (spawnedProc?.pid) {
      try {
        process.kill(-spawnedProc.pid, 'SIGTERM');
      } catch {
        spawnedProc.kill('SIGTERM');
      }
    }
  }
}

run().catch((err) => {
  console.error('[verify:ui] Failed:', err);
  process.exit(1);
});
