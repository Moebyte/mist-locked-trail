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

function target(choice) {
  return typeof choice.goto === 'function' ? choice.goto(E.state) : choice.goto;
}

const fullItems = [{ name: '清场指令', desc: '' }, { name: '光华货运单', desc: '' }];

// 即使时间对象已经过了旧 deadline，也不应再设置 missed_deadline 或路由到迟到结局。
reset({
  inGameTime: { day: 3, hour: 1, minute: 0 },
  pressure: { heat: 0, deadline: { day: 2, hour: 23, minute: 0 } },
});
assert(E.deadlinePhase() === 'safe', `硬时间退役后 deadlinePhase 应固定 safe，实际 ${E.deadlinePhase()}`);
assert(E.routeDockByPressure() !== 'ch4_dock_cleared', `routeDockByPressure 不应再路由清场，实际 ${E.routeDockByPressure()}`);
assert(!E.getFlag('missed_deadline'), '硬时间退役后不应由 routeDockByPressure 设置 missed_deadline');
assert(E.v07ResolveEnding() !== 'end_too_late', `结局不应再进入 end_too_late，实际 ${E.v07ResolveEnding()}`);

// 旧 flag 兼容：missed_deadline + 零证人全物证应收束为空仓余证。
reset({
  flags: { missed_deadline: true, dock_entry_committed: true },
  items: fullItems,
});
assert(E.v07ResolveEnding() === 'end_evidence_only', `旧 missed_deadline + 全物证应收束为空仓余证，实际 ${E.v07ResolveEnding()}`);

// 旧节点本身保留但改名为空仓余证兼容文案。
assert(nodes.end_too_late?.title === '结局 · 空仓余证', `end_too_late 应作为兼容节点改名为空仓余证，实际 ${nodes.end_too_late?.title}`);
const text = typeof nodes.end_too_late?.text === 'function' ? nodes.end_too_late.text(E.state) : String(nodes.end_too_late?.text || '');
assert(text.includes('旧的“迟到一步”结局已退役'), 'end_too_late 兼容文案应说明迟到一步已退役');

if (errors.length) {
  console.error('Deadline deprecation smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Deadline deprecation smoke passed.');
