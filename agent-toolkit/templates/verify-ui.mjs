#!/usr/bin/env node
/**
 * Universal Agent Visual UI Inspector & Layout Auditor (Playwright Chromium)
 * Works out-of-the-box with any Vite, Next.js, CRA, or static web application.
 *
 * Features:
 * 1. Auto-detects running dev server (:3000, :5173, :4173, :8080) or spawns a temporary server.
 * 2. Captures Desktop (1440x900) and Mobile (390x844) full-viewport screenshots into `.ui-screenshots/`.
 * 3. Auto-discovers top-level navigation tabs (`[role="tab"]`, `nav button`, `header button[data-tab]`)
 *    and screenshots each view automatically.
 * 4. Audits DOM geometry for:
 *    - Uncaught page exceptions (`pageerror`) and `console.error`
 *    - Horizontal page overflow (`documentElement.scrollWidth > innerWidth`)
 *    - Clipped text inside buttons/badges (`scrollWidth > clientWidth + 2`)
 *    - Overlapping interactive buttons
 * 5. Saves machine-readable `.ui-screenshots/report.json` + human summary so AI agents
 *    can inspect `.ui-screenshots/*.png` via `view_file`.
 *
 * Usage:
 *   npm run verify:ui
 *   node scripts/verify-ui.mjs --url=http://127.0.0.1:3000 --out=.ui-screenshots --max-tabs=6
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const args = process.argv.slice(2);
const getArg = (prefix, fallback = null) => {
  const match = args.find((a) => a.startsWith(`${prefix}=`));
  return match ? match.slice(prefix.length + 1) : fallback;
};

const argUrl = getArg('--url');
const argOut = getArg('--out', '.ui-screenshots');
const maxTabs = Number(getArg('--max-tabs', '6')) || 6;
const outDir = path.resolve(process.cwd(), argOut);

async function loadPlaywright() {
  try {
    return await import('playwright');
  } catch {
    console.error(
      '[verify:ui] Missing "playwright" package. Run: npm i -D playwright && npx playwright install chromium'
    );
    process.exit(1);
  }
}

async function isReachable(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(1500) });
    return res.ok || res.status === 304;
  } catch {
    return false;
  }
}

async function detectExistingServer() {
  const candidates = [
    'http://127.0.0.1:3000',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:4173',
    'http://127.0.0.1:8080',
  ];
  for (const url of candidates) {
    if (await isReachable(url)) return url;
  }
  return null;
}

async function waitForServer(url, timeoutMs = 25000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isReachable(url)) return true;
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
}

function startTemporaryServer(port) {
  const distIndex = path.resolve(process.cwd(), 'dist/index.html');
  const cmdArgs = fs.existsSync(distIndex)
    ? ['vite', 'preview', '--port', String(port), '--host', '127.0.0.1', '--strictPort']
    : ['vite', '--port', String(port), '--host', '127.0.0.1', '--strictPort'];
  return spawn('npx', cmdArgs, {
    cwd: process.cwd(),
    stdio: 'pipe',
    detached: true,
    env: { ...process.env, BROWSER: 'none' },
  });
}

async function auditDomGeometry(page, viewLabel) {
  return page.evaluate((label) => {
    const issues = [];
    const vw = window.innerWidth;
    const docScrollW = document.documentElement.scrollWidth;
    if (docScrollW > vw + 4) {
      issues.push({
        view: label,
        type: 'HORIZONTAL_PAGE_OVERFLOW',
        detail: `Document scrollWidth (${docScrollW}px) exceeds viewport width (${vw}px)`,
      });
    }

    const candidates = Array.from(
      document.querySelectorAll('button, a, [role="tab"], [role="button"], h1, h2, h3')
    );
    const visibleButtons = [];

    for (const el of candidates) {
      const style = window.getComputedStyle(el);
      if (
        style.display === 'none' ||
        style.visibility === 'hidden' ||
        Number(style.opacity) === 0
      ) {
        continue;
      }
      const rect = el.getBoundingClientRect();
      if (rect.width < 4 || rect.height < 4) continue;

      const text = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 48);

      // Check unintentionally clipped single-line elements without ellipsis intent
      const isEllipsis = style.textOverflow === 'ellipsis';
      if (
        !isEllipsis &&
        (style.overflowX === 'hidden' || style.overflow === 'hidden') &&
        el.scrollWidth > el.clientWidth + 6 &&
        text.length > 0
      ) {
        issues.push({
          view: label,
          type: 'CLIPPED_TEXT',
          detail: `"${text}" (${el.tagName.toLowerCase()}) scrollWidth=${el.scrollWidth}px > clientWidth=${el.clientWidth}px`,
        });
      }

      if (el.tagName === 'BUTTON' || el.getAttribute('role') === 'tab') {
        visibleButtons.push({ text: text || el.getAttribute('aria-label') || 'button', rect });
      }
    }

    // Check overlapping sibling buttons in the same visual row
    for (let i = 0; i < visibleButtons.length; i++) {
      for (let j = i + 1; j < visibleButtons.length; j++) {
        const a = visibleButtons[i].rect;
        const b = visibleButtons[j].rect;
        const overlapX = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
        const overlapY = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
        if (overlapX > 6 && overlapY > 6) {
          issues.push({
            view: label,
            type: 'ELEMENT_OVERLAP',
            detail: `"${visibleButtons[i].text}" overlaps "${visibleButtons[j].text}" by ${Math.round(overlapX)}x${Math.round(overlapY)}px`,
          });
        }
      }
    }

    return issues;
  }, viewLabel);
}

function sanitizeSlug(text, index) {
  const clean = (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);
  return `${String(index).padStart(2, '0')}-${clean || 'view'}`;
}

async function run() {
  const { chromium } = await loadPlaywright();
  fs.mkdirSync(outDir, { recursive: true });

  let targetUrl = argUrl || (await detectExistingServer());
  let spawnedProc = null;

  if (!targetUrl) {
    const tempPort = 4173;
    targetUrl = `http://127.0.0.1:${tempPort}`;
    console.log(`[verify:ui] No running dev server detected. Spawning server at ${targetUrl}...`);
    spawnedProc = startTemporaryServer(tempPort);
    const ready = await waitForServer(targetUrl, 25000);
    if (!ready) {
      if (spawnedProc?.pid) {
        try {
          process.kill(-spawnedProc.pid, 'SIGTERM');
        } catch {}
      }
      throw new Error(`Server did not become reachable at ${targetUrl}`);
    }
  }

  let browser = null;
  const pageErrors = [];
  const consoleErrors = [];
  const layoutIssues = [];
  const screenshots = [];

  try {
    browser = await chromium.launch({
      headless: true,
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
        if (!text.includes('WebSocket') && !text.includes('WebGPU') && !text.includes('favicon')) {
          consoleErrors.push(text);
        }
      }
    });

    console.log(`[verify:ui] Navigating to ${targetUrl}...`);
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);

    // 1. Initial Desktop Screenshot + Audit
    const homeFile = '01-desktop-home.png';
    await page.screenshot({ path: path.join(outDir, homeFile), fullPage: false });
    screenshots.push(homeFile);
    layoutIssues.push(...(await auditDomGeometry(page, 'desktop-home')));

    // 2. Auto-discover top navigation / tab buttons and click through up to maxTabs
    const tabSelectors = [
      'header nav button:visible',
      '[role="tablist"] [role="tab"]:visible',
      'nav button:visible',
    ];
    let discoveredCount = 0;
    for (const sel of tabSelectors) {
      const loc = page.locator(sel);
      const count = await loc.count();
      if (count > 1) {
        const limit = Math.min(count, maxTabs);
        for (let i = 0; i < limit; i++) {
          const btn = loc.nth(i);
          const label = ((await btn.innerText().catch(() => '')) || `tab-${i + 1}`)
            .trim()
            .replace(/\s+/g, ' ');
          await btn.click({ timeout: 2500 }).catch(() => {});
          await page.waitForTimeout(450);
          const slug = sanitizeSlug(label, i + 2);
          const fileName = `${slug}.png`;
          await page.screenshot({ path: path.join(outDir, fileName), fullPage: false });
          screenshots.push(fileName);
          layoutIssues.push(...(await auditDomGeometry(page, label)));
          discoveredCount++;
        }
        break;
      }
    }

    // 3. Mobile Viewport Responsive Audit (390x844)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(450);
    const mobileFile = `${String(discoveredCount + 2).padStart(2, '0')}-mobile-390x844.png`;
    await page.screenshot({ path: path.join(outDir, mobileFile), fullPage: false });
    screenshots.push(mobileFile);
    layoutIssues.push(...(await auditDomGeometry(page, 'mobile-390x844')));

    const report = {
      timestamp: new Date().toISOString(),
      targetUrl,
      outputDirectory: outDir,
      screenshots,
      pageErrors,
      consoleErrors,
      layoutIssues,
      status: pageErrors.length === 0 && consoleErrors.length === 0 ? 'PASS' : 'FAIL',
    };

    fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2), 'utf8');

    console.log(`\n[verify:ui] Visual & DOM Audit Summary (${report.status}):`);
    console.log(`  Screenshots (${screenshots.length}): ${screenshots.map((s) => path.join(argOut, s)).join(', ')}`);
    console.log(`  Page errors: ${pageErrors.length} | Console errors: ${consoleErrors.length} | Layout warnings: ${layoutIssues.length}`);
    if (layoutIssues.length > 0) {
      for (const issue of layoutIssues.slice(0, 10)) {
        console.warn(`  [LAYOUT] [${issue.view}] ${issue.type}: ${issue.detail}`);
      }
    }
    if (pageErrors.length > 0 || consoleErrors.length > 0) {
      console.error('  [ERRORS]', [...pageErrors, ...consoleErrors]);
      process.exitCode = 1;
    }
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (spawnedProc?.pid) {
      try {
        process.kill(-spawnedProc.pid, 'SIGTERM');
      } catch {}
    }
  }
}

run().catch((err) => {
  console.error('[verify:ui] Fatal error:', err);
  process.exit(1);
});
