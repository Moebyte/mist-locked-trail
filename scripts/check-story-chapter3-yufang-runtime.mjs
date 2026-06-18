#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { runStoryModuleScripts } from './story-module-loader.mjs';

const repoRoot = process.cwd();
const loadErrors = [];
const errors = [];
const domReadyHandlers = [];

function read(rel) {
  return fs.readFileSync(path.join(repoRoot, rel), 'utf8');
}

function freshState(overrides = {}) {
  return {
    chapter: 0,
    flags: {},
    clues: [],
    items: [],
    contacts: [],
    pressure: { heat: 0, deadline: { day: 2, hour: 23, minute: 0 } },
    inGameTime: { day: 2, hour: 9, minute: 0 },
    ...overrides,
  };
}

const E = {
  state: freshState(),
  freshState,
  init() {}, toast() {}, saveGame() {}, updateStatus() {}, openDeduction() {},
  addClue(name, desc = '') { if (!this.hasClue(name)) this.state.clues.push({ name, desc }); },
  hasClue(name) { return this.state.clues.some(c => c.name === name); },
  addItem(name, desc = '') { if (!this.hasItem(name)) this.state.items.push({ name, desc }); },
  hasItem(name) { return this.state.items.some(i => i.name === name); },
  addContact(name) { if (!this.state.contacts.includes(name)) this.state.contacts.push(name); },
  discoverRelation(name) { this.addContact(name); },
  setFlag(k, v = true) { this.state.flags[k] = v; },
  getFlag(k) { return this.state.flags[k]; },
  canDeduce() { return true; },
  caseStrength() { return { name: 'audit', desc: 'audit' }; },
  deadlinePhase() { return 'safe'; },
  v07InvestigationQuality() { return { score: 0, reasons: [] }; },
};

const locationStub = { href: 'http://localhost/', search: '', hash: '', pathname: '/' };
const documentStub = {
  write() {},
  addEventListener(event, handler) { if (event === 'DOMContentLoaded') domReadyHandlers.push(handler); },
  getElementById() { return { style: {}, innerHTML: '', textContent: '', appendChild() {}, addEventListener() {} }; },
  createElement() { return { style: {}, appendChild() {} }; },
};

const context = vm.createContext({
  console,
  E,
  document: documentStub,
  window: { location: locationStub },
  location: locationStub,
  URL,
  URLSearchParams,
  localStorage: { getItem() { return null; }, setItem() {} },
  setTimeout(fn) { if (typeof fn === 'function') fn(); },
  clearTimeout() {},
});
context.globalThis = context;
context.window = context;

function runScript(rel, suffix = '') {
  try {
    vm.runInContext(read(rel) + suffix, context, { filename: rel });
  } catch (error) {
    loadErrors.push(`${rel}: ${error.message}`);
  }
}

function resetState(overrides = {}) {
  E.state = freshState(overrides);
}

function choiceTargets(id, overrides = {}) {
  resetState(overrides);
  const node = context.nodes?.[id];
  const choices = typeof node?.choices === 'function' ? node.choices(E.state) : node?.choices;
  return (Array.isArray(choices) ? choices : [])
    .map(choice => typeof choice.goto === 'function' ? choice.goto(E.state) : choice.goto)
    .filter(Boolean);
}

function assert(condition, message) {
  if (!condition) errors.push(message);
}

runScript('src/story.js', '\nglobalThis.nodes = nodes;');
runScript('src/main.js');
runStoryModuleScripts(runScript, repoRoot);
for (const handler of domReadyHandlers) {
  try { handler(); } catch (error) { loadErrors.push(`DOMContentLoaded handler: ${error.message}`); }
}

if (loadErrors.length) {
  console.error('\nChapter 3 Yufang runtime gate failed to load runtime:');
  for (const error of loadErrors) console.error(`- ${error}`);
  process.exit(1);
}

const node = context.nodes?.ch3_school_yufang;
assert(Boolean(node), 'missing ch3_school_yufang runtime node');
assert(context.window.MLT_STORY_CHAPTER_3_GUANGHUA_NODES?.includes('ch3_school_yufang'), 'owned node list should include ch3_school_yufang');
assert(context.window.MLT_STORY_CHAPTER_3_GUANGHUA_CONTRACT?.nodes?.includes('ch3_school_yufang'), 'contract should include ch3_school_yufang');
assert(typeof node?.text === 'function' || typeof node?.text === 'string', 'ch3_school_yufang should have renderable text');
assert(!node?.onPresent, 'ch3_school_yufang should not define onPresent');

resetState();
if (typeof node?.effect === 'function') node.effect(E.state);
assert(E.state.clues.some(clue => clue.name === '沈玉芳与陈明远'), 'ch3_school_yufang should grant 沈玉芳与陈明远 clue');

const baseTargets = choiceTargets('ch3_school_yufang');
for (const target of ['ch3_school_teacher', 'ch3_school_weird', 'ch3_school_office', 'ch3_school']) {
  assert(baseTargets.includes(target), `ch3_school_yufang should keep base outbound target ${target}`);
}

const evidenceTargets = choiceTargets('ch3_school_yufang', { flags: { got_chen_evidence: true } });
assert(evidenceTargets.includes('ch3_school_confront_wu'), 'ch3_school_yufang should route to school confrontation after evidence');
assert(evidenceTargets.includes('ch3_school'), 'ch3_school_yufang should keep school hub return');

for (const target of [...baseTargets, ...evidenceTargets]) {
  assert(Boolean(context.nodes?.[target]), `ch3_school_yufang has missing goto target: ${target}`);
}

if (errors.length) {
  console.error('\nChapter 3 Yufang runtime gate failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Chapter 3 Yufang runtime gate passed.');
