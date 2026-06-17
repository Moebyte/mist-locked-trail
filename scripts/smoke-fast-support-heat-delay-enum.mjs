#!/usr/bin/env node
import { loadStoryRuntime } from './story-harness.mjs';

const h = loadStoryRuntime();
const { E } = h;
const errors = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function reset(flags = {}, clues = [], items = []) {
  h.resetState({
    flags: {
      sun_fast_support: true,
      sun_fast_support_active: true,
      dock_fast_support_entry: true,
      dock_entry_committed: true,
      ...flags,
    },
    clues,
    items,
    pressure: { heat: 0, deadline: { day: 2, hour: 23, minute: 0 } },
    inGameTime: { day: 2, hour: 21, minute: 0 },
  });
}

function score() {
  const exposure = E.dockExposureScore();
  const delay = E.dockDelayScore();
  const total = exposure + delay;
  const tier = E.dockHeatTier();
  const route = E.routeDockDeepByPressure();
  return { exposure, delay, total, tier: tier.key, route };
}

function expect(label, flags, clues, items, expected) {
  reset(flags, clues, items);
  const got = score();
  for (const [key, value] of Object.entries(expected)) {
    assert(got[key] === value, `${label}: ${key} 应为 ${value}，实际 ${got[key]}；完整结果 ${JSON.stringify(got)}`);
  }
}

const clearanceClue = [{ name: '公董局公文纸', desc: '' }];
const clearanceItem = [{ name: '清场指令', desc: '' }];
const waybillClue = [{ name: '教具箱走私', desc: '' }];
const waybillItem = [{ name: '光华货运单', desc: '' }];
const bothClues = [...clearanceClue, ...waybillClue];
const bothItems = [...clearanceItem, ...waybillItem];

// 低调优秀路线：指令 + 运单 + 躲木箱，仍应双救。
expect(
  '便衣低调优秀路线：指令+运单+躲木箱',
  { dock_clearance_seen_inside: true, found_door_tool: true, dock_hid_in_crate: true },
  bothClues,
  bothItems,
  { exposure: 0, delay: 3, total: 3, tier: 'low', route: 'ch4_dock_deep_dual' }
);

// 只拿运单 + 躲木箱：轻微 delay，不应过早掉到中风险。
expect(
  '便衣只拿运单并躲木箱',
  { found_door_tool: true, dock_hid_in_crate: true },
  waybillClue,
  waybillItem,
  { exposure: 0, delay: 2, total: 2, tier: 'low', route: 'ch4_dock_deep_dual' }
);

// 指令 + 运单 + 一个明显冒进：仍在中风险边界，救出一方。
expect(
  '便衣全证据但快速穿中道',
  { dock_clearance_seen_inside: true, found_door_tool: true, dock_hid_in_crate: true, dock_shelf_shortcut: true },
  bothClues,
  bothItems,
  { exposure: 1, delay: 3, total: 4, tier: 'mid', route: 'ch4_dock_deep_trace' }
);

// 指令 + 运单 + 多个冒进动作：高风险，空暗室。
expect(
  '便衣全证据且多次冒进',
  {
    dock_clearance_seen_inside: true,
    found_door_tool: true,
    dock_shelf_shortcut: true,
    dock_inner_office_rushed: true,
    skipped_dock_hide: true,
    dock_guard_chase_no_hide: true,
  },
  bothClues,
  bothItems,
  { exposure: 4, delay: 2, total: 6, tier: 'high', route: 'ch4_dock_deep_empty_heat' }
);

// 折回找工具仍是重大失误，直接进入高 delay。
expect(
  '便衣折回找工具',
  { returned_for_door_tool: true, missed_both_due_to_return_tool: true, found_door_tool: true },
  waybillClue,
  waybillItem,
  { exposure: 0, delay: 6, total: 6, tier: 'high', route: 'ch4_dock_empty_after_return' }
);

if (errors.length) {
  console.error('Fast support heat-delay enumeration smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Fast support heat-delay enumeration smoke passed.');
