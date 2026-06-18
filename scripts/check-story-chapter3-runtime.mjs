#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { runStoryModuleScripts } from './story-module-loader.mjs';

const repoRoot = process.cwd();
const loadErrors = [];
const errors = [];

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
    endings: [],
    sceneLog: [],
    currentScene: null,
    visitedNodes: {},
    weatherIdx: 0,
    atmosphere: '秋雨绵绵的午后',
    inGameTime: { day: 2, hour: 9, minute: 0 },
    pressure: { heat: 0, deadline: { day: 2, hour: 23, minute: 0 } },
    ...overrides,
  };
}

const E = {
  state: freshState(),
  saveKey: 'chapter-3-runtime-audit',
  logEl: { innerHTML: '', style: {} },
  sceneEl: { style: {} },
  titleEl: {},
  textEl: {},
  choicesEl: { innerHTML: '', appendChild() {} },
  init() {}, toast() {}, logChoice() {}, logNarration() {}, updateStatus() {}, saveGame() {}, scroll() {}, openPanel() {}, showPresentBtn() {}, applyWeatherClass() {}, ambientLine() {}, openDeduction() {},
  freshState,
  setWeather(i) { this.state.weatherIdx = i; },
  renderAtmosphere() { return ''; },
  setTime(day, hour, minute) { this.state.inGameTime = { day: day || 1, hour: hour || 14, minute: minute || 0 }; },
  advanceTime(hours = 0, minutes = 0) {
    const t = this.state.inGameTime;
    t.minute += minutes; t.hour += hours;
    while (t.minute >= 60) { t.minute -= 60; t.hour += 1; }
    while (t.hour >= 24) { t.hour -= 24; t.day += 1; }
  },
  spendTime(hours = 0, minutes = 0) { this.advanceTime(hours, minutes); this.checkDeadline(); },
  timeToMinutes(t) { return (t.day || 1) * 24 * 60 + (t.hour || 0) * 60 + (t.minute || 0); },
  minutesUntilDeadline() { return this.timeToMinutes(this.state.pressure.deadline) - this.timeToMinutes(this.state.inGameTime); },
  checkDeadline() { if (this.minutesUntilDeadline() < 0) this.setFlag('missed_deadline', true); },
  addHeat(n = 0) { this.state.pressure.heat = Math.max(0, (this.state.pressure.heat || 0) + n); },
  addClue(name, desc = '') { if (!this.hasClue(name)) this.state.clues.push({ name, desc }); },
  hasClue(name) { return this.state.clues.some(c => c.name === name); },
  addItem(name, desc = '') { if (!this.hasItem(name)) this.state.items.push({ name, desc }); },
  hasItem(name) { return this.state.items.some(i => i.name === name); },
  addContact(name) { if (!this.state.contacts.includes(name)) this.state.contacts.push(name); },
  discoverRelation(name) { this.addContact(name); },
  registerRelation() {},
  setFlag(k, v = true) { this.state.flags[k] = v; },
  getFlag(k) { return this.state.flags[k]; },
  canDeduce() { return true; },
  caseStrength() { return { name: 'runtime-audit', desc: 'audit placeholder' }; },
  deadlinePhase() { return 'safe'; },
  v07InvestigationQuality() { return { score: 0, reasons: [] }; },
  pressureLabel() { return 'safe'; },
};

const domReadyHandlers = [];
const locationStub = { href: 'http://localhost/', search: '', hash: '', pathname: '/' };
const documentStub = {
  head: { appendChild() {} },
  write() {},
  location: locationStub,
  addEventListener(event, handler) { if (event === 'DOMContentLoaded') domReadyHandlers.push(handler); },
  getElementById() { return { style: {}, innerHTML: '', textContent: '', appendChild() {}, scrollIntoView() {}, addEventListener() {} }; },
  createElement() { return { className: '', textContent: '', title: '', onclick: null, style: {}, appendChild() {} }; },
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
context.location = locationStub;

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
  const node = context.nodes && context.nodes[id];
  if (!node) return [];
  const choices = typeof node.choices === 'function' ? node.choices(E.state) : node.choices;
  return (Array.isArray(choices) ? choices : [])
    .map(choice => typeof choice.goto === 'function' ? choice.goto(E.state) : choice.goto)
    .filter(Boolean);
}

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function runEffect(id) {
  resetState();
  const node = context.nodes && context.nodes[id];
  if (node && typeof node.effect === 'function') node.effect(E.state);
  return E.state;
}

runScript('src/story.js', '\nglobalThis.nodes = nodes;');
runScript('src/main.js');
runStoryModuleScripts(runScript, repoRoot);
for (const handler of domReadyHandlers) {
  try { handler(); } catch (error) { loadErrors.push(`DOMContentLoaded handler: ${error.message}`); }
}

if (loadErrors.length) {
  console.error('\nChapter 3 runtime gate failed to load runtime:');
  for (const error of loadErrors) console.error(`- ${error}`);
  process.exit(1);
}

if (!context.nodes || typeof context.nodes !== 'object') {
  console.error('Unable to load runtime nodes.');
  process.exit(1);
}

const ownedNodes = ['ch3_school_chen_su', 'ch3_school_weird'];
const requiredTargets = ['ch3_school_weird', 'ch3_school_office', 'ch3_school', 'ch3_school_confront_wu'];

assert(context.window.MLT_STORY_CHAPTER_3_GUANGHUA_READY === true, 'chapter 3 Guanghua module readiness flag missing');
assert(Array.isArray(context.window.MLT_STORY_CHAPTER_3_GUANGHUA_NODES), 'chapter 3 Guanghua owned node list missing');
for (const id of ownedNodes) {
  assert(context.window.MLT_STORY_CHAPTER_3_GUANGHUA_NODES.includes(id), `chapter 3 Guanghua owned node list should include ${id}`);
}
assert(context.window.MLT_STORY_CHAPTER_3_GUANGHUA_CONTRACT, 'chapter 3 Guanghua contract missing');
for (const id of ownedNodes) {
  assert(context.window.MLT_STORY_CHAPTER_3_GUANGHUA_CONTRACT.nodes.includes(id), `chapter 3 Guanghua contract should include ${id}`);
}

for (const id of ownedNodes) {
  const node = context.nodes[id];
  assert(Boolean(node), `missing chapter 3 runtime node: ${id}`);
  if (!node) continue;
  assert(typeof node.text === 'function' || typeof node.text === 'string', `${id} has no renderable text`);
  assert(!node.onPresent, `${id} should remain a simple migrated node without onPresent`);
}

for (const target of requiredTargets) {
  assert(Boolean(context.nodes[target]), `missing chapter 3 outbound target: ${target}`);
}

let state = runEffect('ch3_school_chen_su');
assert(state.clues.some(clue => clue.name === '苏晚亭与陈明远'), 'ch3_school_chen_su should grant 苏晚亭与陈明远 clue');
assert(state.flags.chen_su_link === true, 'ch3_school_chen_su should set chen_su_link flag');

state = runEffect('ch3_school_weird');
assert(state.clues.some(clue => clue.name === '陈老师与女子争吵'), 'ch3_school_weird should grant 陈老师与女子争吵 clue');

const chenSuTargets = choiceTargets('ch3_school_chen_su');
for (const target of ['ch3_school_weird', 'ch3_school_office', 'ch3_school']) {
  assert(chenSuTargets.includes(target), `ch3_school_chen_su should keep outbound target ${target}`);
}

const weirdBaseTargets = choiceTargets('ch3_school_weird');
assert(weirdBaseTargets.includes('ch3_school_office'), 'ch3_school_weird should route to office when evidence is missing');
assert(weirdBaseTargets.includes('ch3_school'), 'ch3_school_weird should allow returning to school hub');

const weirdEvidenceTargets = choiceTargets('ch3_school_weird', { flags: { got_chen_evidence: true } });
assert(weirdEvidenceTargets.includes('ch3_school_confront_wu'), 'ch3_school_weird should route to Wu confrontation after evidence via polish');
assert(weirdEvidenceTargets.includes('ch3_school'), 'ch3_school_weird should keep school hub return after evidence');

for (const target of [...chenSuTargets, ...weirdBaseTargets, ...weirdEvidenceTargets]) {
  assert(Boolean(context.nodes[target]), `chapter 3 migrated node has missing goto target: ${target}`);
}

if (errors.length) {
  console.error('\nChapter 3 runtime gate failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Chapter 3 runtime gate passed: ${ownedNodes.length} migrated node(s) checked after full module load.`);
