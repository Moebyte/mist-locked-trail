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

function gotoOf(choice) {
  return typeof choice?.goto === 'function' ? choice.goto(E.state) : choice?.goto;
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
  clues: [{ name: 'Wang note', desc: '' }, { name: 'Yufang', desc: '' }],
  items: []
});

assert(E.routeDockByPressure() === 'ch4_dock_fast_infiltration', 'before forced solo, stale fast-support flags should route to fast infiltration');
E.forceSoloDockEntry();
assert(E.getFlag('dock_force_solo_entry'), 'forceSoloDockEntry should set dock_force_solo_entry');
assert(!E.getFlag('sun_fast_support') && !E.getFlag('sun_fast_support_active'), 'forceSoloDockEntry should clear fast-support flags');
assert(E.routeDockByPressure() === 'ch4_dock_solo_infiltration', `forced solo should route to solo infiltration, got ${E.routeDockByPressure()}`);

reset({
  flags: { got_wang_note: true, sister_case: true, deduced_chen: true, deduced_lu_zhao: true },
  clues: [{ name: 'Wang note', desc: '' }, { name: 'Yufang', desc: '' }],
  items: []
});

const wrapChoices = choices('ch3_wrapup');
const dockEntry = wrapChoices.find(choice => gotoOf(choice) === 'ch4_suzhou_creek');
assert(dockEntry, `wrapup should offer dock entry, got ${wrapChoices.map(c => c.text).join(' | ')}`);

E.forceSoloDockEntry();
assert(E.getFlag('dock_force_solo_entry'), 'solo intent should set dock_force_solo_entry');

const dockChoices = choices('ch4_suzhou_creek');
const directEntry = dockChoices.find(choice => gotoOf(choice) === 'ch4_dock_solo_infiltration' || String(choice.text || '').includes('潜入') || String(choice.text || '').includes('直接'));
assert(directEntry, `dock exterior should offer a direct entry route, got ${dockChoices.map(c => c.text).join(' | ')}`);
E.forceSoloDockEntry();
directEntry?.effect?.(E.state);
assert(E.routeDockByPressure() === 'ch4_dock_solo_infiltration', `direct solo entry should route to solo infiltration, got ${E.routeDockByPressure()}`);

if (errors.length) {
  console.error('Solo entry route smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Solo entry route smoke passed.');
