#!/usr/bin/env node
import { loadStoryRuntime } from './story-harness.mjs';

const rt = loadStoryRuntime();
const { E, nodes } = rt;
const errors = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function reset(overrides = {}) {
  rt.resetState(overrides);
}

const preparedClues = [
  { name: '王巡官遗留纸条', desc: '' },
  { name: '沈玉芳', desc: '' },
  { name: '苏母认出照片', desc: '' }
];
const preparedItems = [{ name: '苏晚亭的银发夹', desc: '' }];
const preparedFlags = {
  school_wu_three_proofs: true,
  got_wang_note: true,
  sister_case: true,
  shown_photo_to_mother: true,
};

reset({
  currentScene: 'ch4_dock_sun_fast_support',
  inGameTime: { day: 2, hour: 21, minute: 0 },
  pressure: { heat: 0, deadline: { day: 2, hour: 23, minute: 0 } },
  flags: { sun_fast_support: true, sun_support_available: true },
});

rt.renderNode('ch4_dock_sun_fast_support');
const text = typeof nodes.ch4_dock_sun_fast_support.text === 'function'
  ? nodes.ch4_dock_sun_fast_support.text(E.state)
  : nodes.ch4_dock_sun_fast_support.text;

assert(text.includes('低调潜入'), '私下增援文案应显示低调潜入');
assert(!text.includes('只够救人'), '私下增援文案不应显示只够救人');
assert(E.narrativeClockLabel() === '低调潜入', `私下增援状态栏应显示低调潜入，实际 ${E.narrativeClockLabel()}`);

const route = E.routeDockByPressure();
assert(route === 'ch4_dock_fast_infiltration', `私下增援应先进入低调潜入流程，实际 ${route}`);

reset({
  currentScene: 'ch4_dock_sun_fast_support',
  inGameTime: { day: 2, hour: 21, minute: 0 },
  pressure: { heat: 0, deadline: { day: 2, hour: 23, minute: 0 } },
  flags: {
    sun_fast_support: true,
    sun_support_available: true,
    ...preparedFlags,
  },
  clues: preparedClues,
  items: preparedItems,
});

assert(E.trueEndingPrepared(), '完整救人准备状态应为 trueEndingPrepared');
assert(E.trueEndingFastRescuePrepared(), '完整准备 + 快速/一个便衣应为 trueEndingFastRescuePrepared');
assert(E.routeDockByPressure() === 'ch4_dock_fast_infiltration', '完整准备 + 私下增援应先进入低调潜入流程');
E.setFlag('dock_entry_committed', true);
E.setFlag('dock_fast_support_entry', true);
assert(E.routeDockSearchByTime() === 'ch4_dock_full_search', '低调潜入后应进入完整搜查');
assert(E.routeDockDeepByPressure() === 'ch4_dock_deep_dual', '完整准备 + 私下增援 + 低 heat 应能同时找到沈玉芳和苏晚亭');

reset({
  currentScene: 'ch4_dock_wait',
  inGameTime: { day: 2, hour: 21, minute: 0 },
  pressure: { heat: 0, deadline: { day: 2, hour: 23, minute: 0 } },
  flags: {
    sun_wait_support: true,
    sun_support_available: true,
    ...preparedFlags,
  },
  clues: preparedClues,
  items: preparedItems,
});

assert(E.trueEndingPrepared(), '老孙带队也可以是完整救人准备状态');
assert(E.fullSupportTradeoffActive(), '老孙带队应触发 fullSupportTradeoffActive');
assert(E.routeDockByPressure() === 'ch4_dock_full_support_infiltration', '老孙带队应先进入老孙压阵流程');
E.setFlag('dock_entry_committed', true);
E.setFlag('dock_full_support_entry', true);
assert(E.routeDockSearchByTime() === 'ch4_dock_full_search', '老孙带队应保留完整搜查/封锁优势');
assert(E.routeDockDeepByPressure() === 'ch4_dock_deep_trace', '老孙带队默认中 heat，苏晚亭应刚被转走，而不是双人暗室');

if (errors.length) {
  console.error('Sun fast support smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Sun fast support smoke passed.');
