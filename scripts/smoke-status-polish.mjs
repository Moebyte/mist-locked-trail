#!/usr/bin/env node
import { loadStoryRuntime } from './story-harness.mjs';

const rt = loadStoryRuntime();
const checks = [
  ['ch1_open', '序幕 · 委托'],
  ['ch2_home', '第一章 · 寻人'],
  ['ch2_frenchtown', '第二章 · 暗线'],
  ['ch3_school', '第三章 · 光华小学'],
  ['ch4_suzhou_creek', '第四章 · 福生仓'],
  ['ch4_dock_escape', '第四章 · 福生仓'],
  ['ch4_conclusion', '终章 · 真相'],
  ['ch4_pawnshop', '终章 · 真相'],
  ['end_archive', '结局 · 余波'],
  ['end_conspiracy_trace', '结局 · 余波'],
];

if (typeof rt.E.deriveChapterLabel !== 'function') {
  throw new Error('缺少 E.deriveChapterLabel，状态栏章节无法动态推导。');
}

const errors = [];
for (const [sceneId, expected] of checks) {
  rt.E.state.currentScene = sceneId;
  const actual = rt.E.deriveChapterLabel();
  if (actual !== expected) errors.push(`${sceneId}: expected ${expected}, got ${actual}`);
}

if (errors.length) {
  console.error('Status polish smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Status polish smoke passed: ${checks.length} chapter labels.`);
