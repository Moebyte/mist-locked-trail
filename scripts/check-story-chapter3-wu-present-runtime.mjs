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
    endings: [],
    sceneLog: [],
    currentScene: null,
    visitedNodes: {},
    weatherIdx: 0,
    pressure: { heat: 0, deadline: { day: 2, hour: 23, minute: 0 } },
    inGameTime: { day: 2, hour: 9, minute: 0 },
    ...overrides,
  };
}

const E = {
  state: freshState(),
  saveKey: 'chapter-3-wu-present-runtime-audit',
  logEl: null,
  sceneEl: null,
  titleEl: null,
  textEl: null,
  choicesEl: null,
  freshState,
  init() {}, toast() {}, saveGame() {}, updateStatus() {}, openDeduction() {}, openPanel() {}, scroll() {}, showPresentBtn() {}, applyWeatherClass() {}, ambientLine() {}, logChoice() {}, logNarration() {},
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
  caseStrength() { return { name: 'audit', desc: 'audit' }; },
  deadlinePhase() { return 'safe'; },
  v07InvestigationQuality() { return { score: 0, reasons: [] }; },
  pressureLabel() { return 'safe'; },
  setWeather(i) { this.state.weatherIdx = i; },
  renderAtmosphere() { return ''; },
  setTime(day, hour, minute) { this.state.inGameTime = { day: day || 1, hour: hour || 14, minute: minute || 0 }; },
  advanceTime() {}, spendTime() {}, checkDeadline() {}, minutesUntilDeadline() { return 999; }, timeToMinutes() { return 0; }, addHeat() {},
};

function makeElement() {
  return {
    style: {},
    dataset: {},
    className: '',
    id: '',
    innerHTML: '',
    textContent: '',
    title: '',
    value: '',
    checked: false,
    disabled: false,
    children: [],
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    appendChild(child) { this.children.push(child); return child; },
    removeChild(child) { this.children = this.children.filter(item => item !== child); return child; },
    insertBefore(child) { this.children.push(child); return child; },
    replaceChildren(...children) { this.children = children; },
    addEventListener() {},
    removeEventListener() {},
    setAttribute(name, value) { this[name] = value; },
    getAttribute(name) { return this[name]; },
    removeAttribute(name) { delete this[name]; },
    querySelector() { return makeElement(); },
    querySelectorAll() { return []; },
    scrollIntoView() {},
    focus() {},
    blur() {},
    click() {},
  };
}

const locationStub = { href: 'http://localhost/', search: '', hash: '', pathname: '/' };
const documentStub = {
  body: makeElement(),
  head: makeElement(),
  documentElement: makeElement(),
  location: locationStub,
  write() {},
  addEventListener(event, handler) { if (event === 'DOMContentLoaded') domReadyHandlers.push(handler); },
  removeEventListener() {},
  getElementById() { return makeElement(); },
  createElement() { return makeElement(); },
  createTextNode(text = '') { return { textContent: text }; },
  querySelector() { return makeElement(); },
  querySelectorAll() { return []; },
};

const context = vm.createContext({
  console,
  E,
  document: documentStub,
  window: { location: locationStub },
  location: locationStub,
  URL,
  URLSearchParams,
  localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
  sessionStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
  navigator: { userAgent: 'node' },
  history: { pushState() {}, replaceState() {} },
  setTimeout(fn) { if (typeof fn === 'function') fn(); return 0; },
  clearTimeout() {},
  setInterval() { return 0; },
  clearInterval() {},
});
context.globalThis = context;
context.window = context;
context.location = locationStub;
context.self = context;

E.logEl = makeElement();
E.sceneEl = makeElement();
E.titleEl = makeElement();
E.textEl = makeElement();
E.choicesEl = makeElement();

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

function runNodeEffect(id, overrides = {}) {
  resetState(overrides);
  const node = context.nodes?.[id];
  if (typeof node?.effect === 'function') node.effect(E.state);
  return E.state;
}

runScript('src/story.js', '\nglobalThis.nodes = nodes;');
runScript('src/main.js');
runStoryModuleScripts(runScript, repoRoot);
for (const handler of domReadyHandlers) {
  try { handler(); } catch (error) { loadErrors.push(`DOMContentLoaded handler: ${error.message}`); }
}

if (loadErrors.length) {
  console.error('\nChapter 3 Wu present runtime gate failed to load runtime:');
  for (const error of loadErrors) console.error(`- ${error}`);
  process.exit(1);
}

const ownedNodes = ['ch3_wu_present_threat', 'ch3_wu_present_photo'];
for (const id of ownedNodes) {
  const node = context.nodes?.[id];
  assert(Boolean(node), `missing ${id} runtime node`);
  assert(context.window.MLT_STORY_CHAPTER_3_GUANGHUA_NODES?.includes(id), `owned node list should include ${id}`);
  assert(context.window.MLT_STORY_CHAPTER_3_GUANGHUA_CONTRACT?.nodes?.includes(id), `contract should include ${id}`);
  assert(typeof node?.text === 'function' || typeof node?.text === 'string', `${id} should have renderable text`);
  assert(!node?.onPresent, `${id} should not define onPresent after confrontation cleanup`);
}

let state = runNodeEffect('ch3_wu_present_threat');
assert(state.clues.some(item => item.name === '吴校长补充证词'), 'ch3_wu_present_threat should grant 吴校长补充证词 clue');
assert(state.items.some(item => item.name === '校董会采购线索'), 'ch3_wu_present_threat should grant 校董会采购线索 item');
assert(state.flags.wu_procurement_admitted === true, 'ch3_wu_present_threat should set wu_procurement_admitted flag through polish');
assert(state.flags.school_wu_confront_started === true, 'ch3_wu_present_threat should set school_wu_confront_started flag through polish');

state = runNodeEffect('ch3_wu_present_photo');
assert(state.clues.some(item => item.name === '陆小姐与校董会'), 'ch3_wu_present_photo should grant 陆小姐与校董会 clue');
assert(state.contacts.includes('傅启元'), 'ch3_wu_present_photo should add 傅启元 contact');
assert(state.flags.wu_named_fu === true, 'ch3_wu_present_photo should set wu_named_fu flag through polish');
assert(state.flags.school_wu_confront_started === true, 'ch3_wu_present_photo should set school_wu_confront_started flag through polish');

for (const id of ownedNodes) {
  const scenarios = [
    { label: 'empty', overrides: {} },
    { label: 'all-presented', overrides: { flags: { presented_threat_to_wu: true, presented_photo_to_wu: true, presented_university_to_wu: true } } },
    { label: 'threat-proof', overrides: { items: [{ name: '恐吓信', desc: '' }] } },
    { label: 'photo-proof', overrides: { items: [{ name: '三人合影', desc: '' }] } },
    { label: 'university-proof', overrides: { items: [{ name: '日记残页', desc: '' }] } },
  ];
  for (const scenario of scenarios) {
    const targets = choiceTargets(id, scenario.overrides);
    assert(targets.length > 0, `${id} should keep at least one outbound target in ${scenario.label} scenario`);
    for (const target of targets) {
      assert(Boolean(context.nodes?.[target]), `${id} has missing goto target ${target} in ${scenario.label} scenario`);
    }
  }
}

assert(Boolean(context.nodes?.ch3_school_confront_wu), 'ch3_school_confront_wu should remain available as polished confrontation hub');
assert(Boolean(context.nodes?.ch3_wu_present_university), 'ch3_wu_present_university should remain available as sibling evidence node');
assert(Boolean(context.nodes?.ch3_school_after_confront), 'ch3_school_after_confront should remain available as completion target');
assert(Boolean(context.nodes?.ch3_school_confront_incomplete), 'ch3_school_confront_incomplete should remain available as incomplete target');
assert(Boolean(context.nodes?.ch3_wrapup), 'ch3_wrapup should remain available as later flow target');

if (errors.length) {
  console.error('\nChapter 3 Wu present runtime gate failed:');
  for (const error of errors) console.error(`- ${error}`);
  for (const id of ownedNodes) console.error(`Actual ${id} targets: ${choiceTargets(id).join(', ') || 'none'}`);
  process.exit(1);
}

console.log('Chapter 3 Wu present runtime gate passed.');
