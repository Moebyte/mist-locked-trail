import fs from 'node:fs';
import path from 'node:path';

function readManifest(repoRoot = process.cwd()) {
  const manifestPath = path.join(repoRoot, 'src', 'patches.js');
  if (!fs.existsSync(manifestPath)) return [];

  const manifest = fs.readFileSync(manifestPath, 'utf8');
  const matches = [];
  for (const quote of ["'", '"']) {
    const parts = manifest.split(quote);
    for (const part of parts) {
      if (part.startsWith('src/') && part.endsWith('.js') && part !== 'src/patches.js') {
        matches.push(part);
      }
    }
  }
  return [...new Set(matches)];
}

export function listPatchScripts(repoRoot = process.cwd()) {
  return readManifest(repoRoot);
}

export function runPatchScripts(runScript, repoRoot = process.cwd()) {
  for (const rel of listPatchScripts(repoRoot)) {
    runScript(rel);
  }
}

export function readPatchSources(read, repoRoot = process.cwd()) {
  return listPatchScripts(repoRoot).map(read).join('\n');
}
