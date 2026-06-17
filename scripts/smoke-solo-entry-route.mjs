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

reset({
  flags: {
    got_wang_note: true,
    sister_case: true,
    deduced_chen: true,
    deduced_lu_zhao: true,
    sun_fast_support: true,
    sun_fast_support_active: true,
  },
  clues: [{ name: '王巡官遗留纸条', desc: '' }, { name: '沈玉芳', desc: '' }],
  items: []
});

assert(E.routeDockByPressure() === 'ch4_dock_fast_infiltration', '残留便衣 flag 时，未强制 solo 前应会进入低调潜入，用于验证测试有效性');
E.forceSoloDockEntry();
assert(E.getFlag('dock_force_solo_entry'), 'forceSoloDockEntry 应设置 dock_force_solo_entry');
assert(!E.getFlag('sun_fast_support') && !E.getFlag('sun_fast_support_active'), 'forceSoloDockEntry 应清理便衣支援 flag');
assert(E.routeDockByPressure() === 'ch4_dock_solo_infiltration', `强制 solo 后应进入孤身潜入，实际 ${E.routeDockByPressure()}`);

reset({
  flags: { got_wang_note: true, sister_case: true, deduced_chen: true, deduced_lu_zhao: true },
  clues: [{ name: '王巡官遗留纸条', desc: '' }, { name: '沈玉芳', desc: '' }],
  items: []
});
let wrapChoices = choices('ch3_wrapup');
const soloFromWrapup = wrapChoices.find(choice => (choice.text || '').includes('独自去福生仓'));
assert(soloFromWrapup, '线索整理页应显示独自去福生仓入口');
soloFromWrapup?.effect?.(E.state);
assert(E.getFlag('dock_force_solo_entry'), '点击线索整理页 solo 入口应设置 dock_force_solo_entry');

let dockChoices = choices('ch4_suzhou_creek');
const soloDockChoice = dockChoices.find(choice => (choice.text || '').includes('独自从东侧窗户潜入'));
assert(soloDockChoice, `码头外应显示独自从东侧窗户潜入，实际选项：${dockChoices.map(c => c.text).join(' | ')}`);
soloDockChoice?.effect?.(E.state);
assert(E.routeDockByPressure() === 'ch4_dock_solo_infiltration', `点击码头外 solo 入口后应进入孤身潜入，实际 ${E.routeDockByPressure()}`);

if (errors.length) {
  console.error('Solo entry route smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Solo entry route smoke passed.');
