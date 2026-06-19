import fs from 'node:fs';
import path from 'node:path';

export const STORY_CHAPTER_ENTRY = 'src/story-chapters.js';

function readManifest(repoRoot = process.cwd()) {
  const manifestPath = path.join(repoRoot, STORY_CHAPTER_ENTRY);
  if (!fs.existsSync(manifestPath)) return [];
  const manifest = fs.readFileSync(manifestPath, 'utf8');
  const matches = [];
  for (const quote of ["'", '"']) {
    const parts = manifest.split(quote);
    for (const part of parts) {
      if (part.startsWith('src/story/') && part.endsWith('.js')) {
        matches.push(part);
      }
    }
  }
  return [...new Set(matches)];
}

export function listStoryChapterScripts(repoRoot = process.cwd()) {
  return readManifest(repoRoot);
}

export function runStoryChapterScripts(runScript, repoRoot = process.cwd()) {
  for (const rel of readManifest(repoRoot)) {
    runScript(rel);
  }
}
