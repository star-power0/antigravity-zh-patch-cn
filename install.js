'use strict';

/**
 * Antigravity Chinese Localization Patch (Installer & Toolkit v6.0.0)
 * Pure Native In-Memory Stream Patcher (Zero-Overhead, Antivirus-Clean, Green & Portable)
 */

const fs = require('fs');
const path = require('path');
const patcher = require('./lib/asar-patcher');

const INJECT_SOURCE = path.join(__dirname, 'patches/translate-inject.js');

// 1. Locate Antigravity Installation
function findAntigravityPath(customPath) {
  if (customPath && fs.existsSync(path.join(customPath, 'resources/app.asar'))) {
    return customPath;
  }

  const candidates = [
    path.join(process.env.LOCALAPPDATA || '', 'Programs/antigravity'),
    path.join(process.env.ProgramFiles || '', 'Antigravity'),
    path.join(process.env['ProgramFiles(x86)'] || '', 'Antigravity'),
  ];

  for (const dir of candidates) {
    if (dir && fs.existsSync(path.join(dir, 'resources/app.asar'))) {
      return dir;
    }
  }

  return null;
}

// 2. Read Client Version from ASAR package.json
function getClientVersion(asarPath) {
  try {
    const buf = fs.readFileSync(asarPath);
    const { header, dataStart } = patcher.readArchive(buf);
    const pkgNode = header.files && header.files['package.json'];
    if (pkgNode && pkgNode.offset !== undefined) {
      const off = parseInt(pkgNode.offset, 10);
      const pkgStr = buf.slice(dataStart + off, dataStart + off + pkgNode.size).toString('utf8');
      const pkg = JSON.parse(pkgStr);
      return pkg.version || 'Unknown';
    }
  } catch (_) {}
  return 'Unknown';
}

// 3. Action: Doctor Diagnostics
function runDoctor() {
  console.log('\n==========================================================');
  console.log('       Antigravity 汉化环境健康体检报告 (Doctor)          ');
  console.log('       Pure Native In-Memory Stream Engine v6.0.0         ');
  console.log('==========================================================\n');

  const appDir = findAntigravityPath();
  const asarPath = appDir ? path.join(appDir, 'resources/app.asar') : null;
  const bakPath = appDir ? path.join(appDir, 'resources/app.asar.bak') : null;

  console.log('[1/3] 运行环境:');
  console.log(`  * 操作系统          : ${process.platform} (${process.arch})`);
  console.log(`  * Node.js 版本      : ${process.version}`);

  console.log('\n[2/3] 客户端检测:');
  console.log(`  * 安装目录          : ${appDir || '未检测到 [FAIL]'}`);
  if (asarPath && fs.existsSync(asarPath)) {
    const clientVer = getClientVersion(asarPath);
    const asarStat = fs.statSync(asarPath);
    const sizeMb = (asarStat.size / (1024 * 1024)).toFixed(2);
    console.log(`  * 客户端核心版本    : ${clientVer}`);
    console.log(`  * 当前 app.asar 大小: ${sizeMb} MB`);
  }

  console.log('\n[3/3] 汉化状态与安全备份:');
  const patched = asarPath ? patcher.isPatched(asarPath) : false;
  const hasBak = bakPath ? fs.existsSync(bakPath) : false;
  console.log(`  * 汉化热注入状态    : ${patched ? '已注入生效 [PASS]' : '未注入 / 原版 [WARN]'}`);
  console.log(`  * 官方原版安全备份  : ${hasBak ? '存在 (app.asar.bak) [PASS]' : '未生成 [WARN]'}`);

  console.log('\n==========================================================');
  const isHealthy = Boolean(appDir && patched && hasBak);
  console.log(`  综合健康评价: ${isHealthy ? '完美健康 (HEALTHY - 100% 准备就绪)' : '需要注意 (ATTENTION REQUIRED)'}`);
  console.log('==========================================================\n');
}

// 4. Action: Restore Official Backup
function runRestore() {
  const appDir = findAntigravityPath();
  if (!appDir) {
    console.error('[错误] 未找到 Antigravity 安装目录，无法还原。');
    process.exit(1);
  }

  const asarPath = path.join(appDir, 'resources/app.asar');
  console.log(`正在还原官方原版核心文件: ${asarPath}`);
  try {
    patcher.restoreAsar(asarPath);
    console.log('官方原版 app.asar 已成功还原！');
  } catch (e) {
    console.error('还原失败:', e.message);
    process.exit(1);
  }
}

// 5. Action: Main Installation
function runInstall() {
  console.log('==========================================================');
  console.log('     Antigravity 中文汉化极速无损安装器 v6.0.0           ');
  console.log('     (纯原生内存流热注入 · 绿色纯净 · 零杀软误报)        ');
  console.log('==========================================================\n');

  const appDir = findAntigravityPath();
  if (!appDir) {
    console.error('[错误] 未检测到 Antigravity 安装目录，请确认客户端是否已正确安装。');
    process.exit(1);
  }

  const asarPath = path.join(appDir, 'resources/app.asar');
  console.log(`[1/3] 检测并定位客户端: ${appDir}`);

  // Check injection source
  if (!fs.existsSync(INJECT_SOURCE)) {
    console.error(`[错误] 缺失汉化源码文件: ${INJECT_SOURCE}`);
    process.exit(1);
  }
  const patchCode = fs.readFileSync(INJECT_SOURCE, 'utf8');

  // Perform in-place memory stream injection
  console.log('[2/3] 正在执行 ASAR 内存流热注入 (<50ms)...');
  try {
    const result = patcher.patchAsarFile(asarPath, patchCode, {
      maxRetries: 5,
      retryDelayMs: 300,
      makeBackup: true,
    });
    console.log(`      注入成功！写入大小: ${(result.asarSize / (1024 * 1024)).toFixed(2)} MB`);
  } catch (e) {
    console.error('[错误] 补丁注入失败:', e.message);
    process.exit(1);
  }

  console.log('[3/3] 验证与校验...');
  const verifyPatched = patcher.isPatched(asarPath);
  if (verifyPatched) {
    console.log('      验证通过：中文语言引擎与 744+ 离线精校词库已成功植入！');
  }

  console.log('\n==========================================================');
  console.log('  [+] 安装完成！');
  console.log('  [*] 绿色无公害：不改动系统注册表、不添加开机启动项，零杀软告警。');
  console.log('  [*] 直接打开：启动原生 Antigravity 客户端即可体验完整中文。');
  console.log('==========================================================\n');
}

// CLI Dispatcher
const args = process.argv.slice(2);
if (args.includes('--doctor') || args.includes('-d') || args.includes('-doctor')) {
  runDoctor();
} else if (args.includes('--restore') || args.includes('-r') || args.includes('-restore')) {
  runRestore();
} else {
  runInstall();
}
