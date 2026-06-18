#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { STORY_MODULE_ENTRY, listStoryModuleScripts } from './story-module-loader.mjs';

const repoRoot = process.cwd();
const errors = [];

function read(rel) {
  return fs.readFileSync(path.join(repoRoot, rel), 'utf8');
}

function exists(rel) {
  return fs.existsSync(path.join(repoRoot, rel));
}

function assert(condition, message) {
  if (!condition) errors.push(message);
}

const indexHtml = read('index.html');
assert(indexHtml.includes(STORY_MODULE_ENTRY), 'index.html should load the story module entry');
assert(!indexHtml.includes('src/patches.js'), 'legacy patches entry should not be loaded');
assert(!exists('src/patches.js'), 'legacy patches file should not exist');

const modulesJs = read(STORY_MODULE_ENTRY);
const manifestModules = [];
for (const quote of ["'", '"']) {
  for (const part of modulesJs.split(quote)) {
    if (part.startsWith('src/') && part.endsWith('.js') && part !== STORY_MODULE_ENTRY) manifestModules.push(part);
  }
}
const uniqueManifestModules = [...new Set(manifestModules)];
const discoveredModules = listStoryModuleScripts(repoRoot);

assert(uniqueManifestModules.length > 0, 'story module manifest should not be empty');
assert(
  JSON.stringify(uniqueManifestModules) === JSON.stringify(discoveredModules),
  `story module manifest mismatch:\n  story-modules.js=${uniqueManifestModules.join(', ')}\n  loader=${discoveredModules.join(', ')}`
);

for (const rel of discoveredModules) {
  assert(exists(rel), `story module file is missing: ${rel}`);
}

const requiredModules = [
  'src/story-chapters/index.js',
  'src/story-chapters/chapter-1-opening.js',
  'src/story-chapters/chapter-1-opening-contract.js',
  'src/story-chapters/chapter-2-home-xuehua.js',
  'src/story-chapters/chapter-2-home-xuehua-contract.js',
  'src/story-chapters/chapter-2-home-fixed.js',
  'src/story-chapters/chapter-2-home-fixed-contract.js',
  'src/story-chapters/chapter-2-frenchtown-entry.js',
  'src/story-chapters/chapter-2-frenchtown-entry-contract.js',
  'src/story-chapters/chapter-2-frenchtown-tail.js',
  'src/story-chapters/chapter-2-frenchtown-tail-contract.js',
  'src/story-chapters/chapter-2-building-enter.js',
  'src/story-chapters/chapter-2-building-enter-contract.js',
  'src/story-chapters/chapter-2-xuehua-203.js',
  'src/story-chapters/chapter-2-xuehua-203-contract.js',
  'src/story-chapters/endings.js',
  'src/story-chapters/endings-contract.js',
  'src/story-modules/runtime-contract.js',
  'src/story-modules/consistency.js',
  'src/story-modules/evidence.js',
  'src/story-modules/evidence-polish.js',
  'src/story-modules/narrative-depth.js',
  'src/story-modules/causal-echo.js',
  'src/story-modules/ui-responsive.js',
  'src/story-modules/region-gates.js',
];
for (const rel of requiredModules) {
  assert(discoveredModules.includes(rel), `required story module is missing: ${rel}`);
}

if (errors.length) {
  console.error('\nStory module contract check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Story module contract check passed: ${discoveredModules.length} modules registered.`);
