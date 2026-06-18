#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const repoRoot = process.cwd();
const errors = [];

function read(rel) {
  return fs.readFileSync(path.join(repoRoot, rel), 'utf8');
}

function assert(condition, message) {
  if (!condition) errors.push(message);
}

const endingsRel = 'src/story-chapters/endings.js';
const storyRel = 'src/story.js';
const modulesRel = 'src/story-modules.js';

const endingsSource = read(endingsRel);
const storySource = read(storyRel);
const modulesSource = read(modulesRel);

try {
  new vm.Script(endingsSource, { filename: endingsRel });
} catch (error) {
  errors.push(`${endingsRel} 语法错误：${error.message}`);
}

const expectedEndings = new Map([
  ['end_refuse', '结局 · 雨不停'],
  ['end_archive', '结局 · 无声归档'],
  ['end_too_late', '结局 · 迟到一步'],
  ['end_boss_lu', '结局 · 面具之下'],
  ['end_boss_zhao', '结局 · 提线木偶'],
  ['end_boss_wu', '结局 · 师者'],
  ['end_conspiracy', '结局 · 迷雾未尽'],
  ['end_rescue', '结局 · 黎明灯火'],
  ['end_conspiracy_detail', '结局 · 黎明灯火'],
]);

assert(modulesSource.includes(endingsRel), `${modulesRel} 应加载 ${endingsRel}`);

for (const [id, title] of expectedEndings) {
  assert(endingsSource.includes(`${id}: {`), `${endingsRel} 缺少结局节点 ${id}`);
  const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const titlePattern = new RegExp(`${escapedId}:\\s*{[\\s\\S]*?title:\\s*['\"]${escapedTitle}['\"]`);
  assert(titlePattern.test(endingsSource), `${id} 标题应保持为 ${title}`);

  const typePattern = new RegExp(`${escapedId}:\\s*{[\\s\\S]*?type:\\s*['\"]end['\"]`);
  assert(typePattern.test(endingsSource), `${id} 应保持 type: 'end'`);

  assert(storySource.includes(`${id}: {`), `${storyRel} 当前应仍保留 ${id} 作为迁移期回退来源`);
}

const migratedIds = [...endingsSource.matchAll(/^\s*(end_[a-z0-9_]+):\s*{/gm)].map(match => match[1]);
const uniqueMigratedIds = [...new Set(migratedIds)];
assert(
  JSON.stringify(uniqueMigratedIds.sort()) === JSON.stringify([...expectedEndings.keys()].sort()),
  `${endingsRel} 只应登记既有静态结局节点：${uniqueMigratedIds.join(', ')}`
);

if (errors.length) {
  console.error('\nStory endings migration contract check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Story endings migration contract passed: ${expectedEndings.size} endings registered in ${endingsRel}.`);
