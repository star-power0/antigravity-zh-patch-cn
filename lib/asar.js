// Pure-Node ASAR reader/writer (no npx / network dependency).
// Compatible with the header format produced by @electron/asar v4.x,
// which is what current Antigravity (Electron) builds ship.
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BLOCK_SIZE = 4194304; // 4 MiB, matches @electron/asar integrity block size

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
  const jsonSize = buf.readUInt32LE(12);
  const header = JSON.parse(buf.slice(16, 16 + jsonSize).toString('utf8'));
  // @electron/asar v4 pads the header so the file-data section starts 4-byte aligned.
  const dataStart = Math.ceil((16 + jsonSize) / 4) * 4;
  return { header, dataStart };
}

// extract(asarPath, destDir):
//   Decompresses an asar into destDir. Files marked `unpacked` are copied from
//   `<asarPath>.unpacked` so the result is a complete, self-contained tree.
function extract(asarPath, destDir) {
  const buf = fs.readFileSync(asarPath);
  const { header, dataStart } = readArchive(buf);
  const unpackedRoot = asarPath + '.unpacked';

  const walk = (node, rel) => {
    if (!node || typeof node !== 'object') return;
    if (node.files) {
      for (const [name, child] of Object.entries(node.files)) {
        walk(child, rel ? rel + '/' + name : name);
      }
      return;
    }
    const target = path.join(destDir, rel);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    if (typeof node.offset === 'string') {
      const off = parseInt(node.offset, 10);
      fs.writeFileSync(target, buf.slice(dataStart + off, dataStart + off + node.size));
    } else if (node.unpacked) {
      fs.copyFileSync(path.join(unpackedRoot, rel), target);
    } else {
      throw new Error('Unsupported asar entry: ' + rel);
    }
  };

  for (const [name, child] of Object.entries(header.files)) {
    walk(child, name);
  }
}

// pack(srcDir, asarPath, isUnpacked):
//   Packs a directory tree into asarPath. Entries for which isUnpacked(relPath)
//   returns true are stored under `<asarPath>.unpacked` instead of inside the
//   archive (marked `unpacked: true`), mirroring `--unpack-dir` behaviour.
function pack(srcDir, asarPath, isUnpacked) {
  // 1. Collect files in deterministic (readdir) order.
  const files = [];
  const walkDir = (absDir, relDir) => {
    for (const entry of fs.readdirSync(absDir, { withFileTypes: true })) {
      const abs = path.join(absDir, entry.name);
      const rel = relDir ? relDir + '/' + entry.name : entry.name;
      if (entry.isDirectory()) walkDir(abs, rel);
      else files.push({ rel, abs, size: fs.statSync(abs).size });
    }
  };
  walkDir(srcDir, '');

  // 2. Build the header tree and mark unpacked entries.
  const tree = { files: {} };
  for (const f of files) {
    const parts = f.rel.split('/');
    let node = tree;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!node.files[parts[i]]) node.files[parts[i]] = { files: {} };
      node = node.files[parts[i]];
    }
    const leaf = parts[parts.length - 1];
    f.unpacked = isUnpacked ? isUnpacked(f.rel) : false;
    node.files[leaf] = f.unpacked
      ? { size: f.size, unpacked: true }
      : { size: f.size, offset: '0' };
  }

  // 3. Serialize data section, record offsets + integrity.
  const dataBufs = [];
  let cursor = 0;
  for (const f of files) {
    if (f.unpacked) continue;
    const pad = (4 - (cursor % 4)) % 4;
    if (pad) {
      dataBufs.push(Buffer.alloc(pad));
      cursor += pad;
    }
    f.offset = cursor;
    const content = fs.readFileSync(f.abs);
    dataBufs.push(content);
    cursor += content.length;

    const parts = f.rel.split('/');
    let node = tree;
    for (let i = 0; i < parts.length - 1; i++) node = node.files[parts[i]];
    const entry = node.files[parts[parts.length - 1]];
    entry.offset = String(f.offset);
    entry.integrity = integrityFor(content);
  }

  // 4. Write header (new pickle format used by @electron/asar v4).
  const jsonBuf = Buffer.from(JSON.stringify(tree), 'utf8');
  const jsonSize = jsonBuf.length;
  const align4 = (n) => Math.ceil(n / 4) * 4;
  const headerSize = align4(jsonSize + 4);
  const header = Buffer.alloc(align4(16 + jsonSize)); // padded so data starts 4-byte aligned
  header.writeUInt32LE(4, 0);
  header.writeUInt32LE(4 + headerSize, 4);
  header.writeUInt32LE(headerSize, 8);
  header.writeUInt32LE(jsonSize, 12);
  jsonBuf.copy(header, 16);

  fs.writeFileSync(asarPath, Buffer.concat([header, ...dataBufs]));

  // 5. Materialize unpacked files.
  const unpackedRoot = asarPath + '.unpacked';
  for (const f of files) {
    if (!f.unpacked) continue;
    const target = path.join(unpackedRoot, f.rel);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(f.abs, target);
  }

  return { fileCount: files.length, jsonSize };
}

module.exports = { extract, pack };
