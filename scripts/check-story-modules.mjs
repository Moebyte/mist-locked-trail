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

function listFiles(dir) {
  const root = path.join(repoRoot, dir);
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root).map(name => `${dir}/${name}`);
}

const indexHtml = read('index.html');
assert(indexHtml.includes(STORY_MODULE_ENTRY), 'index.html 应加载 src/story-modules.js 作为故事模块入口');
assert(!indexHtml.includes('src/patches.js'), 'index.html 不应继续加载 src/patches.js');
assert(!exists('src/patches.js'), 'src/patches.js 已退役，不应再次出现');

const directStoryScripts = [...indexHtml.matchAll(/src="(src\/[^"]+\.js)"/g)]
  .map(m => m[1])
  .filter(src => src !== 'src/engine.js' && src !== 'src/story.js' && src !== 'src/main.js' && src !== STORY_MODULE_ENTRY);
assert(directStoryScripts.length === 0, `index.html 不应直接加载故事模块：${directStoryScripts.join(', ')}`);

const srcFiles = listFiles('src');
const versionPatchFiles = srcFiles.filter(file => /^src\/v\d+(?:\.\d+)*-.+\.js$/.test(file));
assert(versionPatchFiles.length === 0, `src/v*.js 版本补丁已退役，不应再次出现：${versionPatchFiles.join(', ')}`);

const scriptFiles = listFiles('scripts');
const legacyPatchScripts = scriptFiles.filter(file => /patch/i.test(path.basename(file)));
assert(legacyPatchScripts.length === 0, `scripts/*patch*.mjs 已退役，不应再次出现：${legacyPatchScripts.join(', ')}`);

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
  assert(!/^src\/v\d+(?:\.\d+)*-.+\.js$/.test(rel), `故事模块不应使用版本补丁命名：${rel}`);
}

const requiredModules = [
  'src/story-consistency.js',
  'src/story-evidence.js',
  'src/story-evidence-polish.js',
  'src/story-narrative-depth.js',
  'src/story-ui-responsive.js',
];
for (const rel of requiredModules) {
  assert(discoveredModules.includes(rel), `story-modules.js 缺少必需模块：${rel}`);
}

const combinedSource = discoveredModules.map(read).join('\n');
for (const symbol of ['v07ResolveEnding', 'v07InvestigationQuality', 'applyResponsiveStoryUI']) {
  assert(combinedSource.includes(symbol), `故事模块源码缺少关键标识：${symbol}`);
}

if (errors.length) {
  console.error('\nStory module contract check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Story module contract check passed: ${discoveredModules.length} modules registered.`);
