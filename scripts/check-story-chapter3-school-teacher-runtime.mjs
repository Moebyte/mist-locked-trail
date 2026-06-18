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
  saveKey: 'chapter-3-school-teacher-runtime-audit',
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
  console.error('\nChapter 3 school teacher runtime gate failed to load runtime:');
  for (const error of loadErrors) console.error(`- ${error}`);
  process.exit(1);
}

const id = 'ch3_school_teacher';
const node = context.nodes?.[id];
assert(Boolean(node), 'missing ch3_school_teacher runtime node');
assert(context.window.MLT_STORY_CHAPTER_3_GUANGHUA_NODES?.includes(id), 'owned node list should include ch3_school_teacher');
assert(context.window.MLT_STORY_CHAPTER_3_GUANGHUA_CONTRACT?.nodes?.includes(id), 'contract should include ch3_school_teacher');
assert(typeof node?.text === 'function' || typeof node?.text === 'string', 'ch3_school_teacher should have renderable text');
assert(!node?.onPresent, 'ch3_school_teacher onPresent should be removed by confrontation cleanup');
assert(typeof node?.presentFilter === 'function', 'ch3_school_teacher should have presentFilter after confrontation cleanup');
assert(node?.presentFilter?.() === false, 'ch3_school_teacher presentFilter should disable evidence presentation after cleanup');

const state = runNodeEffect(id);
assert(state.clues.some(item => item.name === '陈明远坠楼案'), 'ch3_school_teacher should grant 陈明远坠楼案 clue');
assert(state.contacts.includes('陈明远'), 'ch3_school_teacher should discover 陈明远 relation/contact');
assert(state.flags.asked_about_chen === true, 'ch3_school_teacher should set asked_about_chen flag');

const scenarios = [
  { label: 'fresh', overrides: {} },
  { label: 'asked chen-su', overrides: { flags: { chen_su_link: true } } },
  { label: 'asked weird', overrides: { clues: [{ name: '陈老师与女子争吵', desc: '' }] } },
  { label: 'office searched', overrides: { flags: { got_chen_evidence: true } } },
  { label: 'questioning complete', overrides: { flags: { chen_su_link: true, got_chen_evidence: true }, clues: [{ name: '陈老师与女子争吵', desc: '' }] } },
  { label: 'questioning complete and closed', overrides: { flags: { chen_su_link: true, got_chen_evidence: true, school_wu_confront_closed: true }, clues: [{ name: '陈老师与女子争吵', desc: '' }] } },
];

for (const scenario of scenarios) {
  const targets = choiceTargets(id, scenario.overrides);
  assert(targets.length > 0, `ch3_school_teacher should keep at least one outbound target in ${scenario.label} scenario`);
  for (const target of targets) {
    assert(Boolean(context.nodes?.[target]), `ch3_school_teacher has missing goto target ${target} in ${scenario.label} scenario`);
  }
}

assert(choiceTargets(id).includes('ch3_school_chen_su'), 'fresh ch3_school_teacher choices should include ch3_school_chen_su');
assert(choiceTargets(id).includes('ch3_school_weird'), 'fresh ch3_school_teacher choices should include ch3_school_weird');
assert(choiceTargets(id).includes('ch3_school_office'), 'fresh ch3_school_teacher choices should include ch3_school_office');
assert(choiceTargets(id).includes('ch3_school'), 'fresh ch3_school_teacher choices should include ch3_school return target');
assert(choiceTargets(id, { flags: { chen_su_link: true, got_chen_evidence: true }, clues: [{ name: '陈老师与女子争吵', desc: '' }] }).includes('ch3_school_confront_wu'), 'complete questioning should unlock ch3_school_confront_wu');

assert(Boolean(context.nodes?.ch3_school), 'ch3_school should remain available as school region hub');
assert(Boolean(context.nodes?.ch3_school_chen_su), 'ch3_school_chen_su should remain available as teacher follow-up target');
assert(Boolean(context.nodes?.ch3_school_weird), 'ch3_school_weird should remain available as teacher follow-up target');
assert(Boolean(context.nodes?.ch3_school_office), 'ch3_school_office should remain available as teacher follow-up target');
assert(Boolean(context.nodes?.ch3_school_confront_wu), 'ch3_school_confront_wu should remain available as polished confrontation target');

if (errors.length) {
  console.error('\nChapter 3 school teacher runtime gate failed:');
  for (const error of errors) console.error(`- ${error}`);
  console.error(`Actual ch3_school_teacher targets: ${choiceTargets(id).join(', ') || 'none'}`);
  process.exit(1);
}

console.log('Chapter 3 school teacher runtime gate passed.');
