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
  saveKey: 'chapter-3-office-runtime-audit',
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

runScript('src/story.js', '\nglobalThis.nodes = nodes;');
runScript('src/main.js');
runStoryModuleScripts(runScript, repoRoot);
for (const handler of domReadyHandlers) {
  try { handler(); } catch (error) { loadErrors.push(`DOMContentLoaded handler: ${error.message}`); }
}

if (loadErrors.length) {
  console.error('\nChapter 3 office runtime gate failed to load runtime:');
  for (const error of loadErrors) console.error(`- ${error}`);
  process.exit(1);
}

const node = context.nodes?.ch3_school_office;
assert(Boolean(node), 'missing ch3_school_office runtime node');
assert(context.window.MLT_STORY_CHAPTER_3_GUANGHUA_NODES?.includes('ch3_school_office'), 'owned node list should include ch3_school_office');
assert(context.window.MLT_STORY_CHAPTER_3_GUANGHUA_CONTRACT?.nodes?.includes('ch3_school_office'), 'contract should include ch3_school_office');
assert(typeof node?.text === 'function' || typeof node?.text === 'string', 'ch3_school_office should have renderable text');
assert(!node?.onPresent, 'ch3_school_office should not define onPresent');

resetState();
if (typeof node?.effect === 'function') node.effect(E.state);
for (const clue of ['陈老师遗物', '陈老师给苏晚亭的信']) {
  assert(E.state.clues.some(item => item.name === clue), `ch3_school_office should grant clue ${clue}`);
}
for (const item of ['永昌当票', '未寄出的信']) {
  assert(E.state.items.some(entry => entry.name === item), `ch3_school_office should grant item ${item}`);
}
assert(E.state.flags.got_chen_evidence === true, 'ch3_school_office should set got_chen_evidence flag');

const targets = choiceTargets('ch3_school_office');
for (const target of ['ch3_chen_letter', 'ch3_school_confront_wu']) {
  assert(targets.includes(target), `ch3_school_office should keep polished outbound target ${target}`);
  assert(Boolean(context.nodes?.[target]), `ch3_school_office has missing goto target ${target}`);
}
assert(Boolean(context.nodes?.ch3_wrapup), 'ch3_wrapup should remain available as a later flow target');

if (errors.length) {
  console.error('\nChapter 3 office runtime gate failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Chapter 3 office runtime gate passed.');
