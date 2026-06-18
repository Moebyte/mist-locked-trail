#!/usr/bin/env node
import { loadStoryRuntime } from './story-harness.mjs';

const rt = loadStoryRuntime();
const { E, nodes, context } = rt;
const errors = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function reset(overrides = {}) {
  rt.resetState(overrides);
}

function choicesOf(id) {
  return rt.choicesOf(id);
}

function texts(id) {
  return choicesOf(id).map(choice => choice.text || choice.fogText || '');
}

function targets(id) {
  return choicesOf(id)
    .map(choice => typeof choice.goto === 'function' ? choice.goto(E.state) : choice.goto)
    .filter(Boolean);
}

function hasText(id, fragment) {
  return texts(id).some(text => text.includes(fragment));
}

function hasTarget(id, target) {
  return targets(id).includes(target);
}

const id = 'ch3_wrapup';
const node = nodes[id];

assert(Boolean(node), 'missing ch3_wrapup runtime node');
assert(context.window.MLT_STORY_CHAPTER_3_WRAPUP_READY === true, 'chapter 3 wrapup module should report ready');
assert(context.window.MLT_STORY_CHAPTER_3_WRAPUP_NODES?.includes(id), 'owned node list should include ch3_wrapup');
assert(context.window.MLT_STORY_CHAPTER_3_WRAPUP_CONTRACT?.nodes?.includes(id), 'contract should include ch3_wrapup');
assert(typeof node?.text === 'function' || typeof node?.text === 'string', 'ch3_wrapup should have renderable text');
assert(typeof node?.choices === 'function' || Array.isArray(node?.choices), 'ch3_wrapup should have choices');

reset();
const rendered = typeof node.text === 'function' ? node.text(E.state) : node.text;
assert(String(rendered).includes('调查进度') || String(rendered).includes('线索') || String(rendered).includes('下一步'), 'ch3_wrapup should render investigation progress or next-step text');

reset({ flags: { got_case_file: true } });
assert(hasTarget(id, 'ch2_police_wang'), 'wrapup should allow returning to police for Wang note when case file exists but note is missing');

reset({ flags: { got_wang_note: true } });
assert(hasTarget(id, 'ch4_suzhou_creek'), 'wrapup should allow Fusheng/Suzhou creek route when Wang note exists and Yufang is not found');

reset({ clues: [{ name: '福生仓位置', desc: '' }] });
assert(hasTarget(id, 'ch4_suzhou_creek'), 'wrapup should allow Fusheng/Suzhou creek route when Fusheng location clue exists');

reset({ flags: { visited_pawn: true }, items: [{ name: '翡翠镯', desc: '' }] });
assert(!hasTarget(id, 'ch4_pawnshop'), 'wrapup should hide pawnshop route after jade/pawnshop has been resolved');

reset({ flags: { deduced_fusheng: true, rescued_yufang: true } });
assert(hasTarget(id, 'end_conspiracy_detail'), 'wrapup should expose hidden conspiracy detail ending when Fusheng is deduced and Yufang is rescued');
const hiddenChoice = choicesOf(id).find(choice => {
  const target = typeof choice.goto === 'function' ? choice.goto(E.state) : choice.goto;
  return target === 'end_conspiracy_detail';
});
assert(typeof hiddenChoice?.effect === 'function', 'hidden ending wrapup choice should set hidden_end_unlocked');
if (typeof hiddenChoice?.effect === 'function') {
  hiddenChoice.effect(E.state);
  assert(E.getFlag('hidden_end_unlocked') === true, 'hidden ending choice should set hidden_end_unlocked');
}

reset({ flags: { deduced_chen: true, deduced_lu_zhao: true, deduced_fusheng: true, rescued_yufang: true } });
assert(hasTarget(id, 'end_conspiracy_detail') || hasText(id, '结案') || hasText(id, '最终'), 'wrapup should keep at least one late-game closure route');

const scenarios = [
  { label: 'fresh', overrides: {} },
  { label: 'police return', overrides: { flags: { got_case_file: true } } },
  { label: 'fusheng by note', overrides: { flags: { got_wang_note: true } } },
  { label: 'fusheng by clue', overrides: { clues: [{ name: '福生仓位置', desc: '' }] } },
  { label: 'after pawn', overrides: { flags: { visited_pawn: true }, items: [{ name: '翡翠镯', desc: '' }] } },
  { label: 'hidden ending', overrides: { flags: { deduced_fusheng: true, rescued_yufang: true } } },
  { label: 'missed deadline', overrides: { flags: { got_wang_note: true, missed_deadline: true } } },
];

for (const scenario of scenarios) {
  reset(scenario.overrides);
  const emitted = targets(id);
  for (const target of emitted) {
    assert(Boolean(nodes[target]), `ch3_wrapup has missing goto target ${target} in ${scenario.label} scenario`);
  }
}

if (errors.length) {
  console.error('\nChapter 3 wrapup runtime gate failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Chapter 3 wrapup runtime gate passed.');
