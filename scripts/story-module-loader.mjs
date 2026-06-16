import fs from 'node:fs';
import path from 'node:path';

export const STORY_MODULE_ENTRY = 'src/story-modules.js';

function readManifest(repoRoot = process.cwd()) {
  const manifestPath = path.join(repoRoot, STORY_MODULE_ENTRY);
  if (!fs.existsSync(manifestPath)) return [];

  const manifest = fs.readFileSync(manifestPath, 'utf8');
  const matches = [];
  for (const quote of ["'", '"']) {
    const parts = manifest.split(quote);
    for (const part of parts) {
      if (part.startsWith('src/') && part.endsWith('.js') && part !== STORY_MODULE_ENTRY) {
        matches.push(part);
      }
    }
  }
  return [...new Set(matches)];
}

export function listStoryModuleScripts(repoRoot = process.cwd()) {
  return readManifest(repoRoot);
}

export function runStoryModuleScripts(runScript, repoRoot = process.cwd()) {
  for (const rel of listStoryModuleScripts(repoRoot)) {
    runScript(rel);
  }
}

export function readStoryModuleSources(read, repoRoot = process.cwd()) {
  return listStoryModuleScripts(repoRoot).map(read).join('\n');
}
