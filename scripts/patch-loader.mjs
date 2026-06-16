import fs from 'node:fs';
import path from 'node:path';

const PATCH_RE = /^v(\d+(?:\.\d+)*)-.+\.js$/;

function versionParts(fileName) {
  const match = fileName.match(PATCH_RE);
  if (!match) return [];
  return match[1].split('.').map(n => Number.parseInt(n, 10));
}

function comparePatchFiles(a, b) {
  const av = versionParts(a);
  const bv = versionParts(b);
  const len = Math.max(av.length, bv.length);
  for (let i = 0; i < len; i += 1) {
    const diff = (av[i] || 0) - (bv[i] || 0);
    if (diff !== 0) return diff;
  }
  return a.localeCompare(b);
}

export function listPatchScripts(repoRoot = process.cwd()) {
  const srcDir = path.join(repoRoot, 'src');
  if (!fs.existsSync(srcDir)) return [];
  return fs.readdirSync(srcDir)
    .filter(file => PATCH_RE.test(file))
    .sort(comparePatchFiles)
    .map(file => `src/${file}`);
}

export function runPatchScripts(runScript, repoRoot = process.cwd()) {
  for (const rel of listPatchScripts(repoRoot)) {
    runScript(rel);
  }
}

export function readPatchSources(read, repoRoot = process.cwd()) {
  return listPatchScripts(repoRoot).map(read).join('\n');
}
