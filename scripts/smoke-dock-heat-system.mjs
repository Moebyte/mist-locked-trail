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
  flags: { ...preparedFlags, sun_fast_support: true, dock_fast_support_entry: true, dock_entry_committed: true, dock_moved_slowly: true, dock_observed: true },
  clues: preparedClues,
  items: preparedItems,
});
assert(E.dockSupportMode() === 'fast', `一个便衣应识别为 fast，实际 ${E.dockSupportMode()}`);
assert(E.dockExposureScore() === 0, `谨慎低调路线暴露应为 0，实际 ${E.dockExposureScore()}`);
assert(E.dockDelayScore() === 2, `观察+慢行应产生拖延 2，实际 ${E.dockDelayScore()}`);
assert(E.dockHeatTier().key === 'low', `一个便衣谨慎但不拖太久应为低风险，实际 ${JSON.stringify(E.dockHeatTier())}`);
assert(E.routeDockDeepByPressure() === 'ch4_dock_deep_dual', '低风险应进入双人暗室');

reset({
  pressure: { heat: 0, deadline: { day: 2, hour: 23, minute: 0 } },
  flags: { ...preparedFlags, sun_wait_support: true, dock_full_support_entry: true, dock_entry_committed: true, dock_full_support_tradeoff: true },
  clues: preparedClues,
  items: preparedItems,
});
assert(E.dockSupportMode() === 'full', `老孙带队应识别为 full，实际 ${E.dockSupportMode()}`);
assert(E.dockHeatTier().key === 'high', `老孙带队未优化应为高风险，实际 ${JSON.stringify(E.dockHeatTier())}`);
assert(E.routeDockDeepByPressure() === 'ch4_dock_deep_empty_heat', '老孙带队未优化应可能两人都被转走');

reset({
  pressure: { heat: 0, deadline: { day: 2, hour: 23, minute: 0 } },
  flags: {
    ...preparedFlags,
    sun_wait_support: true,
    dock_full_support_entry: true,
    dock_entry_committed: true,
    dock_full_support_tradeoff: true,
    dock_sun_outer_quiet: true,
    dock_sun_block_truck_lane: true,
  },
  clues: preparedClues,
  items: preparedItems,
});
assert(E.dockHeatTier().key === 'mid', `老孙带队优化外围后应压到中风险，实际 ${JSON.stringify(E.dockHeatTier())}`);
assert(E.routeDockDeepByPressure() === 'ch4_dock_deep_trace', '老孙带队优化后应至少能救沈玉芳，但苏晚亭大概率被转走');

reset({
  pressure: { heat: 1, deadline: { day: 2, hour: 23, minute: 0 } },
  flags: { ...preparedFlags, sun_fast_support: true, dock_fast_support_entry: true, dock_entry_committed: true, skipped_dock_hide: true, dock_guard_chase_no_hide: true },
  clues: preparedClues,
  items: preparedItems,
});
assert(E.dockHeatTier().key === 'mid', `单次触发守卫不应一票否决，应只是中风险，实际 ${JSON.stringify(E.dockHeatTier())}`);
assert(E.routeDockDeepByPressure() === 'ch4_dock_deep_trace', '单次触发守卫后应由累计风险判定为只剩一人');

reset({
  pressure: { heat: 0, deadline: { day: 2, hour: 23, minute: 0 } },
  flags: {
    ...preparedFlags,
    sun_fast_support: true,
    dock_fast_support_entry: true,
    dock_entry_committed: true,
    dock_observed: true,
    dock_moved_slowly: true,
    dock_clearance_seen_inside: true,
    dock_hid_in_crate: true,
  },
  clues: preparedClues,
  items: preparedItems,
});
assert(E.dockExposureScore() === 0, `全程谨慎路线暴露应很低，实际 ${E.dockExposureScore()}`);
assert(E.dockDelayScore() >= 4, `过度谨慎应累计拖延，实际 ${E.dockDelayScore()}`);
assert(E.dockHeatTier().key === 'mid', `过度谨慎不能免费，应至少变成中风险，实际 ${JSON.stringify(E.dockHeatTier())}`);
assert(E.routeDockDeepByPressure() === 'ch4_dock_deep_trace', '过度谨慎应可能错过苏晚亭，只剩沈玉芳');

reset({
  pressure: { heat: 3, deadline: { day: 2, hour: 23, minute: 0 } },
  flags: {
    ...preparedFlags,
    sun_fast_support: true,
    dock_fast_support_entry: true,
    dock_entry_committed: true,
    dock_shelf_shortcut: true,
    skipped_crates_for_sound: true,
    skipped_dock_hide: true,
    dock_guard_chase_no_hide: true,
  },
  clues: preparedClues,
  items: preparedItems,
});
assert(E.dockHeatTier().key === 'high', `多个潜入坑叠加后应为高风险，实际 ${JSON.stringify(E.dockHeatTier())}`);
assert(E.routeDockDeepByPressure() === 'ch4_dock_deep_empty_heat', '高风险应进入两人都不在的空暗室');

reset({
  pressure: { heat: 0, deadline: { day: 2, hour: 23, minute: 0 } },
  flags: { ...preparedFlags, sun_fast_support: true, missed_both_due_to_return_tool: true },
  clues: preparedClues,
  items: preparedItems,
});
assert(E.dockHeatTier().key === 'high', '折回找工具错过窗口应直接视为高风险');
assert(E.routeDockDeepByPressure() === 'ch4_dock_empty_after_return', '折回找工具应进入专属空暗室节点');

if (errors.length) {
  console.error('Dock heat system smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Dock heat system smoke passed.');
