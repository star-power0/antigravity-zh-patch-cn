'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BLOCK_SIZE = 4194304; // 4 MiB, matches @electron/asar integrity block size
const PATCH_MARKER = '// Antigravity Chinese Localization Patch';

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function integrityFor(content) {
  const blocks = [];
  for (let i = 0; i < content.length; i += BLOCK_SIZE) {
    blocks.push(sha256(content.slice(i, i + BLOCK_SIZE)));
  }
  return {
    algorithm: 'SHA256',
    hash: sha256(content),
    blockSize: BLOCK_SIZE,
    blocks,
  };
}

function readArchive(buf) {
  if (buf.length < 16) {
    throw new Error('ASAR buffer too small');
  }
  const magic = buf.readUInt32LE(0);
  if (magic !== 4) {
    throw new Error('Invalid ASAR magic number');
  }
  const jsonSize = buf.readUInt32LE(12);
  const header = JSON.parse(buf.slice(16, 16 + jsonSize).toString('utf8'));
  const dataStart = Math.ceil((16 + jsonSize) / 4) * 4;
  return { header, dataStart };
}

function collectEntries(node, currentPath, entries) {
  if (!node || typeof node !== 'object') return;
  if (node.files) {
    for (const [name, child] of Object.entries(node.files)) {
      const subPath = currentPath ? `${currentPath}/${name}` : name;
      collectEntries(child, subPath, entries);
    }
    return;
  }
  const isUnpacked = Boolean(node.unpacked);
  const oldOffset = node.offset !== undefined ? parseInt(node.offset, 10) : 0;
  const size = typeof node.size === 'number' ? node.size : 0;
  entries.push({
    path: currentPath,
    node,
    oldOffset,
    size,
    isUnpacked,
    overriddenData: null,
  });
}

function findEntry(entries, targetSubPath) {
  const normalized = targetSubPath.replace(/\\/g, '/');
  return entries.find(e => e.path === normalized || e.path.endsWith('/' + normalized));
}

function isPatched(asarPath) {
  if (!fs.existsSync(asarPath)) return false;
  try {
    const buf = fs.readFileSync(asarPath);
    const { header, dataStart } = readArchive(buf);
    const entries = [];
    collectEntries(header, '', entries);
    const preload = findEntry(entries, 'dist/preload.js');
    if (!preload) return false;
    const preloadBuf = buf.slice(dataStart + preload.oldOffset, dataStart + preload.oldOffset + preload.size);
    return preloadBuf.includes(Buffer.from(PATCH_MARKER));
  } catch (err) {
    return false;
  }
}

function patchAsarBuffer(originalBuf, patchCode) {
  const { header, dataStart } = readArchive(originalBuf);
  const entries = [];
  collectEntries(header, '', entries);

  const preloadEntry = findEntry(entries, 'dist/preload.js');
  if (!preloadEntry) {
    throw new Error('dist/preload.js entry not found in ASAR header');
  }

  // Extract existing preload code
  const oldPreloadBytes = originalBuf.slice(
    dataStart + preloadEntry.oldOffset,
    dataStart + preloadEntry.oldOffset + preloadEntry.size
  );
  let oldPreload = oldPreloadBytes.toString('utf8');

  // Strip existing patch if already present
  const markerIdx = oldPreload.indexOf(PATCH_MARKER);
  if (markerIdx >= 0) {
    oldPreload = oldPreload.substring(0, markerIdx).trimEnd();
  }

  // Form new preload content
  const newPreload = oldPreload + '\r\n\r\n' + patchCode;
  const newPreloadBytes = Buffer.from(newPreload, 'utf8');

  preloadEntry.overriddenData = newPreloadBytes;
  preloadEntry.size = newPreloadBytes.length;
  preloadEntry.node.size = newPreloadBytes.length;
  preloadEntry.node.integrity = integrityFor(newPreloadBytes);

  // Sort entries by old offset to preserve file layout in data section
  entries.sort((a, b) => a.oldOffset - b.oldOffset);

  // Recalculate offsets for all packed files
  let cursor = 0;
  const dataChunks = [];
  for (const entry of entries) {
    if (entry.isUnpacked) continue;

    entry.node.offset = String(cursor);
    const chunk = entry.overriddenData
      ? entry.overriddenData
      : originalBuf.slice(dataStart + entry.oldOffset, dataStart + entry.oldOffset + entry.size);

    dataChunks.push(chunk);
    cursor += chunk.length;
  }

  // Build pickle ASAR header
  const jsonBuf = Buffer.from(JSON.stringify(header), 'utf8');
  const jsonSize = jsonBuf.length;
  const align4 = (n) => Math.ceil(n / 4) * 4;
  const headerPayloadSize = align4(jsonSize + 4);
  const totalHeaderSize = align4(16 + jsonSize);

  const headerBuf = Buffer.alloc(totalHeaderSize);
  headerBuf.writeUInt32LE(4, 0);
  headerBuf.writeUInt32LE(4 + headerPayloadSize, 4);
  headerBuf.writeUInt32LE(headerPayloadSize, 8);
  headerBuf.writeUInt32LE(jsonSize, 12);
  jsonBuf.copy(headerBuf, 16);

  return Buffer.concat([headerBuf, ...dataChunks]);
}

function patchAsarFile(asarPath, patchCode, options = {}) {
  const { maxRetries = 5, retryDelayMs = 300, makeBackup = true } = options;
  if (!fs.existsSync(asarPath)) {
    throw new Error(`Target ASAR not found: ${asarPath}`);
  }

  const asarDir = path.dirname(asarPath);
  const bakPath = path.join(asarDir, 'app.asar.bak');
  const tempPatchedPath = path.join(asarDir, 'app.asar.patched.tmp');

  // Create clean backup if not existing and current file is unpatched
  if (makeBackup && !fs.existsSync(bakPath)) {
    const currentlyPatched = isPatched(asarPath);
    if (!currentlyPatched) {
      fs.copyFileSync(asarPath, bakPath);
    }
  }

  // Base patching on clean official backup when available to eliminate legacy dirty files
  const sourcePath = (fs.existsSync(bakPath)) ? bakPath : asarPath;
  const originalBuf = fs.readFileSync(sourcePath);
  const newBuf = patchAsarBuffer(originalBuf, patchCode);

  if (newBuf.length < 1024 * 1024) {
    throw new Error(`Generated ASAR size abnormally small (${newBuf.length} bytes). Aborting.`);
  }

  // Write to temp file first
  fs.writeFileSync(tempPatchedPath, newBuf);

  // Atomic file swap with retry backoff for Windows file locks
  let swapped = false;
  let lastError = null;

  for (let i = 1; i <= maxRetries; i++) {
    try {
      // Direct replace
      fs.copyFileSync(tempPatchedPath, asarPath);
      swapped = true;
      break;
    } catch (err) {
      lastError = err;
      if (i < maxRetries) {
        // Synchronous sleep using Atomics
        const waitBuffer = new Int32Array(new SharedArrayBuffer(4));
        Atomics.wait(waitBuffer, 0, 0, retryDelayMs * i);
      }
    }
  }

  // Clean up temp file
  try {
    if (fs.existsSync(tempPatchedPath)) fs.unlinkSync(tempPatchedPath);
  } catch (_) {}

  if (!swapped) {
    throw new Error(`Failed to swap patched ASAR after ${maxRetries} retries: ${lastError.message}`);
  }

  return { success: true, asarSize: newBuf.length };
}

function restoreAsar(asarPath) {
  const asarDir = path.dirname(asarPath);
  const bakPath = path.join(asarDir, 'app.asar.bak');
  if (!fs.existsSync(bakPath)) {
    throw new Error(`Backup file not found: ${bakPath}`);
  }
  fs.copyFileSync(bakPath, asarPath);
  return true;
}

module.exports = {
  PATCH_MARKER,
  isPatched,
  readArchive,
  patchAsarBuffer,
  patchAsarFile,
  restoreAsar,
};
