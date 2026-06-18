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

function runNode(id) {
  const node = h.nodes[id];
  assert(node, `缺少节点：${id}`);
  if (!node) return;
  if (typeof node.effect === 'function') node.effect(E.state);
}

function resolveGoto(choice) {
  return typeof choice.goto === 'function' ? choice.goto(E.state) : choice.goto;
}

function runChoice(id, textFragment) {
  h.renderNode(id);
  const choices = h.choicesOf(id);
  const choice = choices.find(c => (c.text || c.fogText || '').includes(textFragment));
  assert(choice, `节点 ${id} 找不到选项：${textFragment}；实际 ${choices.map(c => c.text || c.fogText || '').join(' / ')}`);
  if (!choice) return null;
  if (typeof choice.effect === 'function') choice.effect(E.state);
  return resolveGoto(choice);
}

function runChoiceTo(id, target) {
  h.renderNode(id);
  const choices = h.choicesOf(id);
  const choice = choices.find(c => resolveGoto(c) === target);
  assert(choice, `节点 ${id} 找不到通往 ${target} 的选项；实际 ${choices.map(c => `${c.text || c.fogText || ''} -> ${resolveGoto(c)}`).join(' / ')}`);
  if (!choice) return null;
  if (typeof choice.effect === 'function') choice.effect(E.state);
  return resolveGoto(choice);
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
  { exposure: 0, delay: 2, total: 2, tier: 'low', route: 'ch4_dock_deep_dual' }
);

// 只拿运单 + 躲木箱：轻微 delay，不应过早掉到中风险。
expect(
  '便衣只拿运单并躲木箱',
  { found_door_tool: true, dock_hid_in_crate: true },
  waybillClue,
  waybillItem,
  { exposure: 0, delay: 1, total: 1, tier: 'low', route: 'ch4_dock_deep_dual' }
);

// 指令 + 运单 + 一个明显冒进：便衣低调掩护仍能吸收一次小失误，但不能吸收多次冒进。
expect(
  '便衣全证据但快速穿中道',
  { dock_clearance_seen_inside: true, found_door_tool: true, dock_hid_in_crate: true, dock_shelf_shortcut: true },
  bothClues,
  bothItems,
  { exposure: 1, delay: 2, total: 3, tier: 'low', route: 'ch4_dock_deep_dual' }
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

// 真实玩家路径：便衣进入 → 账房拿指令 → 慢行到货架 → 查教具箱 → 躲木箱 → 开暗门，必须双救。
h.resetState({
  flags: { sun_fast_support: true },
  pressure: { heat: 0, deadline: { day: 2, hour: 23, minute: 0 } },
  inGameTime: { day: 2, hour: 21, minute: 0 },
});
runNode('ch4_dock_fast_infiltration');
let goto = runChoice('ch4_dock_fast_infiltration', '借便衣掩护');
assert(goto === 'ch4_dock_full_search', `便衣入口应进入完整搜索窗口，实际 ${goto}`);
runNode(goto);
goto = runChoiceTo('ch4_dock_full_search', 'ch4_dock_inner_office');
assert(goto === 'ch4_dock_inner_office', `应能先去临时账房，实际 ${goto}`);
runNode(goto);
goto = runChoiceTo('ch4_dock_inner_office', 'ch4_dock_shelf_approach');
assert(goto === 'ch4_dock_shelf_approach', `账房后应到货架区，实际 ${goto}`);
runNode(goto);
goto = runChoiceTo('ch4_dock_shelf_approach', 'ch4_dock_crates');
assert(goto === 'ch4_dock_crates', `货架区应能查教具箱，实际 ${goto}`);
runNode(goto);
goto = runChoiceTo('ch4_dock_crates', 'ch4_dock_hide');
assert(goto === 'ch4_dock_hide', `查教具箱后应能躲木箱，实际 ${goto}`);
runNode(goto);
goto = runChoiceTo('ch4_dock_hide', 'ch4_dock_locked_door');
assert(goto === 'ch4_dock_locked_door', `躲木箱后应去暗门，实际 ${goto}`);
runNode(goto);
goto = runChoice('ch4_dock_locked_door', '用铁钎');
const actual = score();
assert(goto === 'ch4_dock_deep_dual', `便衣真实优秀路径应进入暗室双救，实际 goto=${goto}；分数 ${JSON.stringify(actual)}`);
assert(actual.tier === 'low', `便衣真实优秀路径应是低风险，实际 ${JSON.stringify(actual)}`);

if (errors.length) {
  console.error('Fast support heat-delay enumeration smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Fast support heat-delay enumeration smoke passed.');
