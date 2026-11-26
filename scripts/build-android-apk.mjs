#!/usr/bin/env node
/**
 * Automated Android .apk builder for Flappy NeuroLab using Capacitor.
 * Can be run locally (`npm run android:apk`) or inside GitHub Actions CI.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function run(cmd, cwd = process.cwd()) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd });
}

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const androidDir = path.join(rootDir, 'android');

console.log('=== [1/4] Building portable Vite production bundle (dist/) ===');
run('npm run build');

if (!fs.existsSync(distDir)) {
  console.error('Error: dist/ directory was not generated.');
  process.exit(1);
}

console.log('=== [2/4] Ensuring Capacitor 7 Android dependencies (JDK 21 compatible) ===');
if (!fs.existsSync(path.join(rootDir, 'node_modules', '@capacitor', 'android'))) {
  run('npm install --no-save --no-audit --no-fund @capacitor/core@^7.0.0 @capacitor/cli@^7.0.0 @capacitor/android@^7.0.0');
}

console.log('=== [3/4] Initializing / Syncing Capacitor Android project ===');
if (!fs.existsSync(androidDir)) {
  run('npx cap add android');
} else {
  run('npx cap sync android');
}

console.log('=== [4/4] Compiling Android .apk via Gradle ===');
const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
if (process.platform !== 'win32') {
  run('chmod +x gradlew', androidDir);
}
run(`${gradlew} assembleDebug`, androidDir);

const apkPath = path.join(
  androidDir,
  'app',
  'build',
  'outputs',
  'apk',
  'debug',
  'app-debug.apk'
);
const outApk = path.join(rootDir, 'Flappy-NeuroLab-android.apk');
if (fs.existsSync(apkPath)) {
  fs.copyFileSync(apkPath, outApk);
  console.log(`\nSUCCESS! Android APK generated at:\n  ${outApk}`);
} else {
  console.error(`\nError: Gradle finished, but expected APK was not found at ${apkPath}`);
  process.exit(1);
}
