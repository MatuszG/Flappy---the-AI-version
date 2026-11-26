#!/usr/bin/env node
/**
 * Universal Agent Toolkit Installer CLI
 *
 * Usage in any project (Google AI Studio, Claude Code, Cursor, or terminal):
 *   npx -y github:<your-username>/agent-toolkit install
 *   node ./agent-toolkit/bin/cli.mjs install
 *   node ./agent-toolkit/bin/cli.mjs install-global-skill
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templatesDir = path.resolve(__dirname, '../templates');

const args = process.argv.slice(2);
const command = args[0] || 'install';
const withPlaywrightInstall = args.includes('--with-browser');
const skipToolkitSrc = args.includes('--no-src');

const MARKER_START = '<!-- AGENT-TOOLKIT:START -->';
const MARKER_END = '<!-- AGENT-TOOLKIT:END -->';

function upsertMarkedBlock(filePath, fragmentContent) {
  let existing = '';
  if (fs.existsSync(filePath)) {
    existing = fs.readFileSync(filePath, 'utf8');
  }

  if (existing.includes(MARKER_START) && existing.includes(MARKER_END)) {
    const startIdx = existing.indexOf(MARKER_START);
    const endIdx = existing.indexOf(MARKER_END) + MARKER_END.length;
    const updated =
      existing.slice(0, startIdx) + fragmentContent.trim() + existing.slice(endIdx);
    fs.writeFileSync(filePath, updated.trimEnd() + '\n', 'utf8');
    return 'updated';
  }

  const prefix = existing.trim().length > 0 ? existing.trimEnd() + '\n\n' : '';
  fs.writeFileSync(filePath, prefix + fragmentContent.trim() + '\n', 'utf8');
  return existing ? 'appended' : 'created';
}

function copyIfMissingOrForced(src, dest, force = false) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (!fs.existsSync(dest) || force) {
    fs.copyFileSync(src, dest);
    return true;
  }
  return false;
}

function installIntoProject(targetRoot = process.cwd()) {
  console.log(`[agent-toolkit] Installing Universal Agent Toolkit into ${targetRoot}...`);

  // 1. Copy scripts/verify-ui.mjs (only if missing or --force, so project-customized verify-ui.mjs isn't overwritten)
  const force = args.includes('--force');
  const targetVerifyScript = path.join(targetRoot, 'scripts/verify-ui.mjs');
  const verifyCopied = copyIfMissingOrForced(
    path.join(templatesDir, 'verify-ui.mjs'),
    targetVerifyScript,
    force
  );
  console.log(
    `  [1/5] scripts/verify-ui.mjs: ${verifyCopied ? 'installed' : 'already exists (kept existing, use --force to overwrite)'}`
  );

  // 2. Copy src/toolkit/* helpers
  if (!skipToolkitSrc) {
    const toolkitFiles = ['workspaceSync.ts', 'i18nFlagToggle.tsx', 'runtimeWatchdog.ts'];
    for (const file of toolkitFiles) {
      copyIfMissingOrForced(
        path.join(templatesDir, 'toolkit', file),
        path.join(targetRoot, 'src/toolkit', file),
        force
      );
    }
    console.log('  [2/5] src/toolkit/{workspaceSync.ts,i18nFlagToggle.tsx,runtimeWatchdog.ts}: installed');
  }

  // 3. Inject Claude/Cursor Skill into .claude/skills/universal-agent-toolkit/SKILL.md
  const skillDest = path.join(
    targetRoot,
    '.claude/skills/universal-agent-toolkit/SKILL.md'
  );
  copyIfMissingOrForced(path.join(templatesDir, 'SKILL.md'), skillDest, true);
  console.log('  [3/5] .claude/skills/universal-agent-toolkit/SKILL.md: installed');

  // 4. Upsert AGENTS.md & CLAUDE.md rule blocks (read automatically by AI Studio <user_rules>, Claude Code, Cursor)
  const fragment = fs.readFileSync(path.join(templatesDir, 'AGENTS.fragment.md'), 'utf8');
  const agentsStatus = upsertMarkedBlock(path.join(targetRoot, 'AGENTS.md'), fragment);
  const claudeStatus = upsertMarkedBlock(path.join(targetRoot, 'CLAUDE.md'), fragment);
  console.log(`  [4/5] AGENTS.md (${agentsStatus}) & CLAUDE.md (${claudeStatus})`);

  // 5. Update package.json scripts & .gitignore
  const pkgPath = path.join(targetRoot, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    pkg.scripts = pkg.scripts || {};
    if (!pkg.scripts['verify:ui']) {
      pkg.scripts['verify:ui'] = 'node scripts/verify-ui.mjs';
    }
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  }

  const gitignorePath = path.join(targetRoot, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gi = fs.readFileSync(gitignorePath, 'utf8');
    if (!gi.includes('.ui-screenshots')) {
      fs.writeFileSync(gitignorePath, gi.trimEnd() + '\n.ui-screenshots/\n', 'utf8');
    }
  }
  console.log('  [5/5] package.json ("verify:ui") & .gitignore (.ui-screenshots/) configured');

  if (withPlaywrightInstall) {
    console.log('[agent-toolkit] Installing Playwright & headless Chromium binary...');
    execSync('npm i -D playwright && npx playwright install chromium', {
      cwd: targetRoot,
      stdio: 'inherit',
    });
  }

  console.log('\n[agent-toolkit] Done! Run `npm run verify:ui` to capture & audit UI screenshots.');
}

function installGlobalSkill() {
  const globalSkillDir = path.join(
    os.homedir(),
    '.claude/skills/universal-agent-toolkit'
  );
  fs.mkdirSync(globalSkillDir, { recursive: true });
  fs.copyFileSync(
    path.join(templatesDir, 'SKILL.md'),
    path.join(globalSkillDir, 'SKILL.md')
  );
  fs.copyFileSync(
    path.join(templatesDir, 'verify-ui.mjs'),
    path.join(globalSkillDir, 'verify-ui.mjs')
  );
  console.log(`[agent-toolkit] Installed global skill into ${globalSkillDir}`);
}

if (command === 'install-global-skill') {
  installGlobalSkill();
} else {
  installIntoProject(process.cwd());
}
