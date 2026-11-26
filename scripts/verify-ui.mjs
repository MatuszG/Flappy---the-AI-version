#!/usr/bin/env node
/**
 * Automated Playwright UI Verification & Multi-Viewport Screenshot Suite
 * for Flappy NeuroLab (Desktop, Tablet Portrait, Tablet Landscape, Mobile).
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

function resolveChromiumExecutable() {
  const defaultPath = chromium.executablePath();
  if (defaultPath && fs.existsSync(defaultPath)) return undefined;

  const candidates = [
    '/ms-playwright/chrome-headless-shell-linux64/chrome-headless-shell',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return undefined;
}

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

async function auditLayout(page, label) {
  return page.evaluate((tag) => {
    const overflowPx = Math.max(
      0,
      document.documentElement.scrollWidth - window.innerWidth
    );
    const header = document.querySelector('header');
    const headerRect = header ? header.getBoundingClientRect() : null;
    const headerHeight = headerRect ? Math.round(headerRect.height) : 0;
    const headerPct =
      headerRect && window.innerHeight > 0
        ? Math.round((headerRect.height / window.innerHeight) * 100)
        : 0;
    return {
      label: tag,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      overflowPx,
      headerHeight,
      headerPct,
    };
  }, label);
}

async function clickHeaderNav(page, pattern) {
  const navBtn = page.locator('header nav').getByRole('button', { name: pattern }).first();
  if (await navBtn.isVisible().catch(() => false)) {
    await navBtn.click({ force: true });
    return;
  }
  const fallbackBtn = page.locator('header').getByRole('button', { name: pattern }).first();
  await fallbackBtn.click({ force: true });
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
  const audits = [];
  const findings = [];

  try {
    const executablePath = resolveChromiumExecutable();
    browser = await chromium.launch({
      headless: true,
      ...(executablePath ? { executablePath } : {}),
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });

    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    page.setDefaultTimeout(7000);

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
    await page.waitForSelector('header');
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('canvas');
    await page.waitForTimeout(700);

    // 1. Desktop 1440x900 — Play First -> Training Lab (PL)
    console.log('[verify:ui] 1. Desktop 1440x900: Play Landing & Training Lab (PL)');
    audits.push(await auditLayout(page, 'desktop-play'));
    await snap(page, '02-desktop-play.png');

    await clickHeaderNav(page, /Trening|Laboratorium|Training/i);
    await page.waitForTimeout(600);
    audits.push(await auditLayout(page, 'desktop-training'));
    await snap(page, '01-desktop-training-pl.png');

    // Toggle to Arena on Desktop & snapshot
    const arenaBtnDesk = page.getByRole('button', { name: /^Arena \(/i }).first();
    if (await arenaBtnDesk.isVisible().catch(() => false)) {
      await arenaBtnDesk.click({ force: true });
      await page.waitForTimeout(350);
      audits.push(await auditLayout(page, 'desktop-training-arena'));
      await snap(page, '17-desktop-training-arena.png');
      const singleBtnDesk = page.getByRole('button', { name: /Pojedyncza Sieć|Single Network/i }).first();
      if (await singleBtnDesk.isVisible().catch(() => false)) {
        await singleBtnDesk.click({ force: true });
        await page.waitForTimeout(200);
      }
    }

    // Language toggle check
    const langBtnSelector = 'header button[title*="English"], header button[title*="polski"], header button[title*="Polish"]';
    const textBefore = (await page.locator(langBtnSelector).first().innerText()).trim();
    await page.locator(langBtnSelector).first().click({ force: true });
    await page.waitForTimeout(200);
    const textAfterEn = (await page.locator(langBtnSelector).first().innerText()).trim();
    const headerTextEn = await page.locator('header').innerText();
    findings.push(
      `lang_toggle=${textBefore}->${textAfterEn}(EN=${/Training|Play|Research/i.test(headerTextEn)})`
    );
    await page.locator(langBtnSelector).first().click({ force: true });
    await page.waitForTimeout(200);

    // 2. Desktop 1440x900 — Play Mode verified on landing above; verify Leaderboard & History tabs
    console.log('[verify:ui] 2. Desktop 1440x900: Play Mode & Leaderboard/History Tabs');
    await clickHeaderNav(page, /Graj|Gra vs AI|Play/i);
    await page.waitForTimeout(450);

    // Seed a sample completed Play entry into localStorage to verify Leaderboard & History rendering
    await page.evaluate(() => {
      const sampleRun = {
        id: 'verify-run-1',
        playerName: 'PilotTest',
        points: 1420,
        pipes: 9,
        orbsCollected: 4,
        maxCombo: 5,
        difficulty: 'MEDIUM',
        subMode: 'VS_AI',
        opponentName: 'Hybrid MoE',
        wonVsAi: true,
        medalId: 'BRONZE',
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem('flappy-neuro-player-nick-v1', 'PilotTest');
      localStorage.setItem('flappy-neuro-play-history-v1', JSON.stringify([sampleRun]));
      localStorage.setItem('flappy-neuro-leaderboard-v1', JSON.stringify([sampleRun]));
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('canvas');
    await page.waitForTimeout(550);

    const lbTabDesk = page.getByRole('tab', { name: /Tabela|Top/i }).first();
    if (await lbTabDesk.isVisible().catch(() => false)) {
      await lbTabDesk.click({ force: true });
      await page.waitForTimeout(250);
      audits.push(await auditLayout(page, 'desktop-play-leaderboard'));
      await snap(page, '18-desktop-play-leaderboard.png');
    }
    const histTabDesk = page.getByRole('tab', { name: /Historia|History/i }).first();
    if (await histTabDesk.isVisible().catch(() => false)) {
      await histTabDesk.click({ force: true });
      await page.waitForTimeout(250);
      audits.push(await auditLayout(page, 'desktop-play-history'));
    }
    const playTabDesk = page.getByRole('tab', { name: /Gra i Tor|Play/i }).first();
    if (await playTabDesk.isVisible().catch(() => false)) {
      await playTabDesk.click({ force: true });
      await page.waitForTimeout(200);
    }

    // 3. Desktop 1440x900 — Research Sweep
    console.log('[verify:ui] 3. Desktop 1440x900: Research Sweep');
    await clickHeaderNav(page, /Badania|Research/i);
    await page.waitForTimeout(500);
    audits.push(await auditLayout(page, 'desktop-research'));
    await snap(page, '03-desktop-research.png');

    // 4. Desktop 1440x900 — Docs
    console.log('[verify:ui] 4. Desktop 1440x900: Docs');
    await clickHeaderNav(page, /Dokumentacja|Docs|Documentation/i);
    await page.waitForTimeout(350);
    audits.push(await auditLayout(page, 'desktop-docs'));
    await snap(page, '04-desktop-docs.png');
    const archSectionBtn = page.locator('button').filter({ hasText: /12 Architektur|12 Architectures/i }).first();
    if (await archSectionBtn.isVisible().catch(() => false)) {
      await archSectionBtn.click();
      await page.waitForTimeout(250);
      audits.push(await auditLayout(page, 'desktop-docs-archs'));
      await snap(page, '04b-desktop-docs-archs.png');
    }

    // 5. Tablet Portrait 768x1024 — Training, Play, Research
    console.log('[verify:ui] 5. Tablet Portrait 768x1024');
    await page.setViewportSize({ width: 768, height: 1024 });
    await clickHeaderNav(page, /Trening|Laboratorium|Training/i);
    await page.waitForTimeout(550);
    audits.push(await auditLayout(page, 'tablet-portrait-training'));
    await snap(page, '05-tablet-portrait-training.png');

    await clickHeaderNav(page, /Graj|Gra vs AI|Play/i);
    await page.waitForTimeout(450);
    audits.push(await auditLayout(page, 'tablet-portrait-play'));
    await snap(page, '06-tablet-portrait-play.png');

    await clickHeaderNav(page, /Badania|Research/i);
    await page.waitForTimeout(450);
    audits.push(await auditLayout(page, 'tablet-portrait-research'));
    await snap(page, '07-tablet-portrait-research.png');

    // 6. Tablet Landscape 1024x768 — Training & Play
    console.log('[verify:ui] 6. Tablet Landscape 1024x768');
    await page.setViewportSize({ width: 1024, height: 768 });
    await clickHeaderNav(page, /Trening|Laboratorium|Training/i);
    await page.waitForTimeout(450);
    audits.push(await auditLayout(page, 'tablet-landscape-training'));
    await snap(page, '08-tablet-landscape-training.png');

    await clickHeaderNav(page, /Graj|Gra vs AI|Play/i);
    await page.waitForTimeout(450);
    audits.push(await auditLayout(page, 'tablet-landscape-play'));
    await snap(page, '09-tablet-landscape-play.png');

    // 7. Mobile 390x844 — Training, Arena, Play, Leaderboard, Modals, Research, Docs
    console.log('[verify:ui] 7. Mobile 390x844');
    await page.setViewportSize({ width: 390, height: 844 });
    await clickHeaderNav(page, /Trening|Laboratorium|Training/i);
    await page.waitForTimeout(550);
    audits.push(await auditLayout(page, 'mobile-training'));
    await snap(page, '10-mobile-training.png');

    const arenaBtnMob = page.getByRole('button', { name: /^Arena \(/i }).first();
    if (await arenaBtnMob.isVisible().catch(() => false)) {
      await arenaBtnMob.click({ force: true });
      await page.waitForTimeout(350);
      audits.push(await auditLayout(page, 'mobile-training-arena'));
      await snap(page, '16-mobile-training-arena.png');
    }

    // Open Saved Brains modal from Training strip & verify mobile modal layout
    const brainsBtn = page.getByRole('button', { name: /Sieci|Brains/i }).first();
    if (await brainsBtn.isVisible().catch(() => false)) {
      await brainsBtn.click({ force: true });
      await page.waitForTimeout(250);
      await snap(page, '14-mobile-modal-brains.png');
      const closeBtn = page.getByRole('button', { name: /Zamknij okno|Close modal/i }).first();
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click({ force: true });
        await page.waitForTimeout(150);
      }
    }

    // Open HowItWorks modal from TopBar & verify mobile modal layout
    const guideBtn = page.locator('header').getByRole('button', { name: /Jak to działa|How It Works|Pomoc|Guide/i }).first();
    if (await guideBtn.isVisible().catch(() => false)) {
      await guideBtn.click({ force: true });
      await page.waitForTimeout(250);
      await snap(page, '15-mobile-modal-guide.png');
      const closeBtn = page.getByRole('button', { name: /Zamknij okno|Close modal|Rozumiem|Got It/i }).first();
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click({ force: true });
        await page.waitForTimeout(150);
      }
    }

    await clickHeaderNav(page, /Graj|Gra vs AI|Play/i);
    await page.waitForTimeout(450);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(100);
    audits.push(await auditLayout(page, 'mobile-play'));
    await snap(page, '11-mobile-play.png');

    const lbTabMob = page.getByRole('tab', { name: /Tabela|Top/i }).first();
    if (await lbTabMob.isVisible().catch(() => false)) {
      await lbTabMob.click({ force: true });
      await page.waitForTimeout(250);
      audits.push(await auditLayout(page, 'mobile-play-leaderboard'));
      await snap(page, '19-mobile-play-leaderboard.png');
    }

    await clickHeaderNav(page, /Badania|Research/i);
    await page.waitForTimeout(450);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(100);
    audits.push(await auditLayout(page, 'mobile-research'));
    await snap(page, '12-mobile-research.png');

    await clickHeaderNav(page, /Dokumentacja|Docs|Documentation/i);
    await page.waitForTimeout(350);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(100);
    audits.push(await auditLayout(page, 'mobile-docs'));
    await snap(page, '13-mobile-docs.png');

    console.log('[verify:ui] Layout Audits:');
    for (const a of audits) {
      console.log(
        `  - ${a.label.padEnd(26)} (${a.viewport}) overflow=${a.overflowPx}px header=${a.headerHeight}px (${a.headerPct}%)`
      );
    }
    console.log('[verify:ui] Checks:', findings.join(' | '));
    console.log(`[verify:ui] Screenshots saved to: ${outDir}`);

    const overflowFailures = audits.filter((a) => a.overflowPx > 4);
    if (pageErrors.length > 0 || consoleErrors.length > 0) {
      console.error('[verify:ui] Runtime errors detected:', { pageErrors, consoleErrors });
      process.exitCode = 1;
    }
    if (overflowFailures.length > 0) {
      console.error('[verify:ui] Horizontal overflow detected:', overflowFailures);
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
