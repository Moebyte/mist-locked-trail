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
    inGameTime: { day: 1, hour: 14, minute: 30 },
    pressure: { heat: 0, deadline: { day: 2, hour: 23, minute: 0 } },
    ...overrides,
  };
}

const E = {
  state: freshState(),
  saveKey: 'chapter-2-runtime-audit',
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

function resetEvidence({ clues = [], items = [], flags = [] } = {}) {
  E.state = freshState();
  for (const clue of clues) E.addClue(clue, 'audit');
  for (const item of items) E.addItem(item, 'audit');
  for (const flag of flags) E.setFlag(flag, true);
}

function choicesOf(id, evidence = {}) {
  resetEvidence(evidence);
  const node = context.nodes && context.nodes[id];
  if (!node) return [];
  const choices = typeof node.choices === 'function' ? node.choices(E.state) : node.choices;
  return Array.isArray(choices) ? choices : [];
}

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function runEffect(id, evidence = {}) {
  resetEvidence(evidence);
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
  console.error('\nChapter 2 runtime audit failed to load runtime:');
  for (const error of loadErrors) console.error(`- ${error}`);
  process.exit(1);
}

if (!context.nodes || typeof context.nodes !== 'object') {
  console.error('Unable to load runtime nodes.');
  process.exit(1);
}

const expectedChapter2Nodes = [
  'ch2_university',
  'ch2_univ_matron',
  'ch2_univ_door',
  'ch2_univ_paper',
  'ch2_leave_univ',
  'ch2_police',
  'ch2_police_file',
  'ch2_police_alt',
  'ch2_police_present',
  'ch2_police_wang',
  'ch2_home',
  'ch2_home_talk',
  'ch2_home_photo',
  'ch2_home_ask_photo',
  'ch2_home_showphoto',
  'ch2_leave_home',
  'ch2_frenchtown',
  'ch2_building_stakeout',
  'ch2_tail',
  'ch2_tea_monitor',
  'ch2_talk_woman',
  'ch2_woman_detail',
  'ch2_building_enter',
  'ch2_ask_landlord',
  'ch2_landlord_map',
  'ch2_203_door',
  'ch2_203_search',
];

const requiredNonChapterTargets = [
  'ch3_school',
  'ch4_su_present_keepsake',
];

for (const id of expectedChapter2Nodes) {
  const node = context.nodes[id];
  assert(Boolean(node), `missing chapter 2 runtime node: ${id}`);
  if (!node) continue;
  assert(typeof node.text === 'function' || typeof node.text === 'string', `${id} has no renderable text`);
}

for (const id of requiredNonChapterTargets) {
  assert(Boolean(context.nodes[id]), `missing required downstream runtime node: ${id}`);
}

const photoState = runEffect('ch2_home_showphoto');
assert(photoState.items.some(item => item.name === '苏晚亭的银发夹'), 'ch2_home_showphoto should grant 苏晚亭的银发夹');
assert(photoState.clues.some(clue => clue.name === '苏母托付信物'), 'ch2_home_showphoto should grant 苏母托付信物');

const mapState = runEffect('ch2_landlord_map');
assert(mapState.flags.shown_map_to_landlord === true || mapState.clues.some(clue => clue.name === '福生仓标识' || clue.name === '福生仓位置'), 'ch2_landlord_map should preserve the Fusheng warehouse lead');

const sampleEvidenceSets = [
  {},
  { clues: ['舍监证词', '法租界地图'], flags: ['asked_door'] },
  { clues: ['母亲证词'], flags: ['asked_photo'] },
  { clues: ['三人合影', '法租界地图'], items: ['三人合影'], flags: ['asked_landlord'] },
  { clues: ['三人合影', '法租界地图'], items: ['三人合影'], flags: ['shown_map_to_landlord', 'got_wang_note'] },
];

for (const id of expectedChapter2Nodes) {
  for (const evidence of sampleEvidenceSets) {
    for (const choice of choicesOf(id, evidence)) {
      if (!choice || !choice.goto) continue;
      const target = typeof choice.goto === 'function' ? choice.goto(E.state) : choice.goto;
      assert(context.nodes[target], `${id} has missing goto target: ${target}`);
    }
  }
}

if (errors.length) {
  console.error('\nChapter 2 runtime audit failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Chapter 2 runtime audit passed: ${expectedChapter2Nodes.length} migrated nodes checked after full module load.`);
