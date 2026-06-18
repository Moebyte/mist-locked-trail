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
assert(indexHtml.includes(STORY_MODULE_ENTRY), 'index.html 应加载 src/story-modules.js 作为故事模块入口');
assert(!indexHtml.includes('src/patches.js'), 'index.html 不应继续加载 src/patches.js');
assert(!exists('src/patches.js'), 'src/patches.js 已退役，不应再次出现');

const modulesJs = read(STORY_MODULE_ENTRY);
const manifestModules = [];
for (const quote of ["'", '"']) {
  for (const part of modulesJs.split(quote)) {
    if (part.startsWith('src/') && part.endsWith('.js') && part !== STORY_MODULE_ENTRY) manifestModules.push(part);
  }
}
const uniqueManifestModules = [...new Set(manifestModules)];
const discoveredModules = listStoryModuleScripts(repoRoot);

assert(uniqueManifestModules.length > 0, 'src/story-modules.js 中没有登记任何故事模块');
assert(
  JSON.stringify(uniqueManifestModules) === JSON.stringify(discoveredModules),
  `故事模块清单不一致：\n  story-modules.js=${uniqueManifestModules.join(', ')}\n  loader=${discoveredModules.join(', ')}`
);

for (const rel of discoveredModules) {
  assert(exists(rel), `故事模块不存在：${rel}`);
}

const requiredModules = [
  'src/story-chapters/index.js',
  'src/story-chapters/chapter-1-opening.js',
  'src/story-chapters/chapter-1-opening-contract.js',
  'src/story-chapters/chapter-2-home-xuehua.js',
  'src/story-chapters/chapter-2-home-xuehua-contract.js',
  'src/story-chapters/chapter-2-home-fixed.js',
  'src/story-chapters/chapter-2-home-fixed-contract.js',
  'src/story-chapters/chapter-2-frenchtown-tail.js',
  'src/story-chapters/chapter-2-frenchtown-tail-contract.js',
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
  assert(discoveredModules.includes(rel), `story-modules.js 缺少必需模块：${rel}`);
}

if (errors.length) {
  console.error('\nStory module contract check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Story module contract check passed: ${discoveredModules.length} modules registered.`);
