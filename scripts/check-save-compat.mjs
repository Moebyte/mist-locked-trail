#!/usr/bin/env node
import { loadStoryRuntime } from './story-harness.mjs';

const errors = [];
const runtime = loadStoryRuntime();
const { E } = runtime;

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function expectMigrates(name, input, checks) {
  try {
    const migrated = E.migrateSaveState(input);
    const validation = E.validateStateShape(migrated);
    assert(validation.ok, `${name}: 迁移后状态结构无效：${validation.errors.join('；')}`);
    checks(migrated);
  } catch (err) {
    errors.push(`${name}: 迁移异常：${err.message}`);
  }
}

expectMigrates('legacy-v0-no-version', {
  clues: ['三人合影', { name: '陈明远的信', desc: '旧存档对象格式' }],
  items: ['铁钎'],
  contacts: ['苏晚亭', '苏晚亭', '周明远'],
  flags: { read_letter: true },
  chapter: 3,
  sceneLog: ['ch1_open', 'ch2_203_search'],
  currentScene: 'ch2_203_search',
  visitedNodes: { ch1_open: 1 },
  endings: [{ id: 'end_rescue', title: '结局 · 雨夜灯火', at: '2026-01-01T00:00:00.000Z' }],
}, state => {
  assert(state.saveVersion === E.saveVersion, 'legacy-v0-no-version: saveVersion 未升级');
  assert(state.clues.length === 2, 'legacy-v0-no-version: clues 未保留');
  assert(state.items[0].name === '铁钎', 'legacy-v0-no-version: 字符串 item 未迁移为对象');
  assert(state.contacts.length === 2, 'legacy-v0-no-version: contacts 未去重');
  assert(state.endings.length === 1, 'legacy-v0-no-version: endings 未保留');
});

expectMigrates('partial-broken-fields', {
  clues: null,
  items: [null, { name: '', desc: 'bad' }, { name: '福生仓地址' }],
  contacts: [123, '沈玉芳'],
  flags: [],
  sceneLog: ['ch4_suzhou_creek'],
  inGameTime: { day: 2, hour: 21 },
  pressure: { heat: 'bad', deadline: null },
  weatherIdx: 'bad',
}, state => {
  assert(Array.isArray(state.clues) && state.clues.length === 0, 'partial-broken-fields: clues 应恢复为空数组');
  assert(state.items.length === 1 && state.items[0].name === '福生仓地址', 'partial-broken-fields: items 未正确过滤');
  assert(state.contacts.length === 1 && state.contacts[0] === '沈玉芳', 'partial-broken-fields: contacts 未正确过滤');
  assert(state.pressure.heat === 0, 'partial-broken-fields: pressure.heat 未回退');
  assert(state.currentScene === 'ch4_suzhou_creek', 'partial-broken-fields: currentScene 未从 sceneLog 回填');
});

expectMigrates('fresh-state-contract', E.freshState(), state => {
  assert(state.saveVersion === E.saveVersion, 'fresh-state-contract: freshState 缺少 saveVersion');
  assert(state.pressure.deadline.day === 2, 'fresh-state-contract: deadline 默认值异常');
});

if (errors.length) {
  console.error('\nSave compatibility check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Save compatibility check passed: saveVersion=${E.saveVersion}.`);
