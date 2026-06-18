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

function runSchoolEffect(overrides = {}) {
  reset(overrides);
  const node = nodes.ch3_school;
  if (typeof node.effect === 'function') node.effect(E.state);
  return E.state;
}

const id = 'ch3_school';
const node = nodes[id];

assert(Boolean(node), 'missing ch3_school runtime node');
assert(context.window.MLT_STORY_CHAPTER_3_GUANGHUA_NODES?.includes(id), 'owned node list should include ch3_school');
assert(context.window.MLT_STORY_CHAPTER_3_GUANGHUA_CONTRACT?.nodes?.includes(id), 'contract should include ch3_school');
assert(typeof node?.text === 'function' || typeof node?.text === 'string', 'ch3_school should have renderable text');
assert(typeof node?.choices === 'function', 'ch3_school choices should be controlled by location hub flow polish at runtime');

const state = runSchoolEffect();
assert(state.contacts.includes('吴校长'), 'ch3_school should add/discover 吴校长');
assert(state.chapter === 3, 'ch3_school should set chapter to 3');

reset();
assert(hasText(id, '问陈老师坠楼的事'), 'fresh ch3_school should ask about Chen first');
assert(hasTarget(id, 'ch3_school'), 'fresh ch3_school Chen question should loop inside the hub');
assert(!hasTarget(id, 'ch3_school_teacher'), 'polished ch3_school should not route to legacy teacher node directly');

reset({ flags: { asked_about_chen: true } });
assert(hasText(id, '问陈老师跟苏晚亭的关系'), 'after Chen question, ch3_school should ask Chen/Su relation');
assert(hasText(id, '问学校最近有没有异常'), 'after Chen question, ch3_school should ask school anomaly');
assert(hasText(id, '查看陈老师办公室'), 'after Chen question, ch3_school should allow office search');

reset({ flags: { asked_about_chen: true, sister_case: true } });
assert(hasText(id, '问沈玉芳老师的事'), 'with sister_case, ch3_school should ask Yufang inside hub');

reset({
  flags: { asked_about_chen: true, chen_su_link: true, got_chen_evidence: true },
  clues: [{ name: '陈老师与女子争吵', desc: '' }],
});
assert(hasText(id, '看陈明远那封未寄出的信'), 'after office search, ch3_school should offer Chen letter reading');
assert(hasTarget(id, 'ch3_school'), 'Chen letter hub choice should remain in ch3_school before final read');

reset({
  flags: { asked_about_chen: true, chen_su_link: true, got_chen_evidence: true, read_letter: true },
  clues: [
    { name: '陈老师与女子争吵', desc: '' },
    { name: '陈明远的信', desc: '' },
  ],
  items: [{ name: '陈明远的信', desc: '' }],
});
assert(hasTarget(id, 'ch3_school_confront_wu'), 'after enough evidence, ch3_school should unlock Wu confrontation');

reset({
  flags: { school_wu_three_proofs: true, school_wu_confront_closed: true },
});
assert(hasTarget(id, 'ch3_wrapup'), 'after three Wu proofs, ch3_school should allow wrapup');

const scenarioList = [
  { label: 'fresh', overrides: {} },
  { label: 'after Chen', overrides: { flags: { asked_about_chen: true } } },
  { label: 'with sister', overrides: { flags: { asked_about_chen: true, sister_case: true } } },
  { label: 'after evidence', overrides: { flags: { asked_about_chen: true, chen_su_link: true, got_chen_evidence: true }, clues: [{ name: '陈老师与女子争吵', desc: '' }] } },
  { label: 'ready confrontation', overrides: { flags: { asked_about_chen: true, chen_su_link: true, got_chen_evidence: true, read_letter: true }, clues: [{ name: '陈老师与女子争吵', desc: '' }, { name: '陈明远的信', desc: '' }] } },
  { label: 'closed confrontation', overrides: { flags: { school_wu_three_proofs: true, school_wu_confront_closed: true } } },
];

for (const scenario of scenarioList) {
  reset(scenario.overrides);
  const emitted = targets(id);
  assert(emitted.length > 0, `ch3_school should emit at least one choice in ${scenario.label} scenario`);
  for (const target of emitted) {
    assert(Boolean(nodes[target]), `ch3_school has missing goto target ${target} in ${scenario.label} scenario`);
  }
}

if (errors.length) {
  console.error('\nChapter 3 school hub runtime gate failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Chapter 3 school hub runtime gate passed.');
