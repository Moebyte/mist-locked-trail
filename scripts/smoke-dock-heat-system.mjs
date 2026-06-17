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

const preparedFlags = {
  school_wu_three_proofs: true,
  got_wang_note: true,
  sister_case: true,
  shown_photo_to_mother: true,
};
const preparedClues = [
  { name: '王巡官遗留纸条', desc: '' },
  { name: '沈玉芳', desc: '' },
  { name: '苏母认出照片', desc: '' }
];
const preparedItems = [{ name: '苏晚亭的银发夹', desc: '' }];

reset({
  pressure: { heat: 0, deadline: { day: 2, hour: 23, minute: 0 } },
  flags: { ...preparedFlags, sun_fast_support: true, dock_fast_support_entry: true, dock_entry_committed: true },
  clues: preparedClues,
  items: preparedItems,
});
assert(E.dockSupportMode() === 'fast', `一个便衣应识别为 fast，实际 ${E.dockSupportMode()}`);
assert(E.dockHeatTier().key === 'low', `一个便衣谨慎潜入应为低 heat，实际 ${JSON.stringify(E.dockHeatTier())}`);
assert(E.routeDockDeepByPressure() === 'ch4_dock_deep_dual', '低 heat 应进入双人暗室');

reset({
  pressure: { heat: 0, deadline: { day: 2, hour: 23, minute: 0 } },
  flags: { ...preparedFlags, sun_wait_support: true, dock_full_support_entry: true, dock_entry_committed: true },
  clues: preparedClues,
  items: preparedItems,
});
assert(E.dockSupportMode() === 'full', `老孙带队应识别为 full，实际 ${E.dockSupportMode()}`);
assert(E.dockHeatTier().key === 'mid', `老孙带队默认应为中 heat，实际 ${JSON.stringify(E.dockHeatTier())}`);
assert(E.routeDockDeepByPressure() === 'ch4_dock_deep_trace', '中 heat 应进入只剩一人的暗室');

reset({
  pressure: { heat: 0, deadline: { day: 2, hour: 23, minute: 0 } },
  flags: { ...preparedFlags, sun_fast_support: true, dock_fast_support_entry: true, dock_entry_committed: true, skipped_dock_hide: true, dock_guard_chase_no_hide: true },
  clues: preparedClues,
  items: preparedItems,
});
assert(E.dockHeatTier().key === 'high', `一个便衣但触发追击后应为高 heat，实际 ${JSON.stringify(E.dockHeatTier())}`);
assert(E.routeDockDeepByPressure() === 'ch4_dock_deep_empty_heat', '高 heat 应进入两人都不在的空暗室');

reset({
  pressure: { heat: 0, deadline: { day: 2, hour: 23, minute: 0 } },
  flags: { ...preparedFlags, sun_fast_support: true, missed_both_due_to_return_tool: true },
  clues: preparedClues,
  items: preparedItems,
});
assert(E.dockHeatTier().key === 'high', '折回找工具错过窗口应直接视为高 heat');
assert(E.routeDockDeepByPressure() === 'ch4_dock_empty_after_return', '折回找工具应进入专属空暗室节点');

if (errors.length) {
  console.error('Dock heat system smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Dock heat system smoke passed.');
