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

reset({
  flags: preparedFlags,
  clues: preparedClues,
  items: [{ name: '苏晚亭的银发夹', desc: '' }],
});
opts = choices('ch4_dock_full_search');
texts = opts.map(choice => choice.text || choice.fogText || '');
assert(texts.some(text => text.includes('没有工具，可能只能砸锁')), '完整搜查时直接找人选项应提示没有工具风险');
assert(opts.find(choice => (choice.text || '').includes('直接顺着声音'))?.goto === 'ch4_dock_locked_door', '直接顺声音应先到暗门节点');

opts = choices('ch4_dock_locked_door');
texts = opts.map(choice => choice.text || choice.fogText || '');
assert(texts.includes('⚠️ 没有工具，强行砸锁开门'), '没有铁钎时应显示强行砸锁风险选项');
assert(opts.find(choice => (choice.text || '').includes('砸锁'))?.goto === 'ch4_dock_break_lock_chase', '没有工具砸锁应进入砸锁追击节点');
assert(opts.find(choice => (choice.text || '').includes('回头检查教具箱'))?.goto === 'ch4_dock_crates', '没有工具时应允许回头检查教具箱');

reset({
  flags: { ...preparedFlags, dock_broke_lock_no_tool: true },
  clues: preparedClues,
  items: [{ name: '苏晚亭的银发夹', desc: '' }],
});
assert(E.routeDockDeepByPressure() === 'ch4_dock_deep_trace', '不检查教具箱砸锁后，应错失苏晚亭，进入线索暗室');

if (errors.length) {
  console.error('Dock hide consequence smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Dock hide consequence smoke passed.');
