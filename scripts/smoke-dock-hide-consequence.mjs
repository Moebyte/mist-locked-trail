#!/usr/bin/env node
import { loadStoryRuntime } from './story-harness.mjs';

const rt = loadStoryRuntime();
const { E } = rt;
const errors = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function reset(overrides = {}) {
  rt.resetState(overrides);
}

function choices(id) {
  rt.renderNode(id);
  return rt.choicesOf(id);
}

const preparedFlags = {
  school_wu_three_proofs: true,
  got_wang_note: true,
  sister_case: true,
  shown_photo_to_mother: true,
  sun_fast_support: true,
  sun_support_available: true,
};
const preparedClues = [{ name: '王巡官遗留纸条', desc: '' }, { name: '沈玉芳', desc: '' }, { name: '苏母认出照片', desc: '' }];
const preparedItems = [{ name: '苏晚亭的银发夹', desc: '' }, { name: '铁钎', desc: '' }];

reset({
  flags: preparedFlags,
  clues: preparedClues,
  items: preparedItems,
});
let opts = choices('ch4_dock_crates');
let texts = opts.map(choice => choice.text || choice.fogText || '');
assert(texts.includes('📦 躲进空木箱，等守卫过去'), '教具箱后应提供躲进木箱选项');
assert(texts.includes('⚠️ 不躲了，拿上铁钎立刻去开暗门'), '教具箱后应提供不躲直接去暗门的风险选项');
assert(opts.find(choice => (choice.text || '').includes('不躲'))?.goto === 'ch4_dock_guard_chase', '不躲应进入守卫追击节点');

reset({
  flags: preparedFlags,
  clues: preparedClues,
  items: preparedItems,
});
rt.renderNode('ch4_dock_hide');
assert(E.routeDockDeepByPressure() === 'ch4_dock_deep_dual', '躲过守卫 + 快速准备齐，应能进入双人暗室');

reset({
  flags: { ...preparedFlags, dock_guard_chase_no_hide: true },
  clues: preparedClues,
  items: preparedItems,
});
assert(E.routeDockDeepByPressure() === 'ch4_dock_deep_trace', '不躲触发追击后，应错失苏晚亭，进入线索暗室');

if (errors.length) {
  console.error('Dock hide consequence smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Dock hide consequence smoke passed.');
