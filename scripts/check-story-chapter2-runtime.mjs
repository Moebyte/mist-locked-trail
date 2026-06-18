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

const windowStub = { location: locationStub };
const context = vm.createContext({
  console,
  E,
  document: documentStub,
  window: windowStub,
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

function rawChoices(id) {
  const node = context.nodes && context.nodes[id];
  if (!node) return [];
  const choices = typeof node.choices === 'function' ? node.choices(E.state) : node.choices;
  return Array.isArray(choices) ? choices : [];
}

function gotos(id, evidence = {}) {
  resetEvidence(evidence);
  return rawChoices(id)
    .filter(choice => typeof choice.when === 'function' ? choice.when(E.state) : true)
    .map(choice => choice && choice.goto)
    .filter(Boolean);
}

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function assertIncludes(list, value, message) {
  assert(list.includes(value), `${message}: expected ${value}, got [${list.join(', ')}]`);
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

for (const id of expectedChapter2Nodes) {
  const node = context.nodes[id];
  assert(Boolean(node), `missing chapter 2 runtime node: ${id}`);
  if (node) assert(typeof node.text === 'function' || typeof node.text === 'string', `${id} has no renderable text`);
}

assertIncludes(gotos('ch2_university'), 'ch2_univ_matron', 'ch2_university early choices');
assertIncludes(gotos('ch2_university'), 'ch2_univ_door', 'ch2_university early choices');
assertIncludes(gotos('ch2_university'), 'ch2_univ_paper', 'ch2_university early choices');
assertIncludes(gotos('ch2_university', { clues: ['舍监证词', '法租界地图'], flags: ['asked_door'] }), 'ch2_leave_univ', 'ch2_university completed choices');

assertIncludes(gotos('ch2_leave_univ', { clues: ['舍监证词', '法租界地图'], flags: ['asked_door'] }), 'ch2_frenchtown', 'ch2_leave_univ completed choices');
assertIncludes(gotos('ch2_leave_univ', { clues: ['舍监证词', '法租界地图'], flags: ['asked_door'] }), 'ch2_police', 'ch2_leave_univ completed choices');
assertIncludes(gotos('ch2_leave_univ', { clues: ['舍监证词', '法租界地图'], flags: ['asked_door'] }), 'ch2_home', 'ch2_leave_univ completed choices');

assertIncludes(gotos('ch2_police'), 'ch2_police_file', 'ch2_police choices');
resetEvidence();
if (typeof context.nodes.ch2_police.onPresent === 'function') {
  const policePresent = context.nodes.ch2_police.onPresent({ name: '半张烟盒纸' }, E.state);
  assert(policePresent && policePresent.goto === 'ch2_police_present', 'ch2_police onPresent should route 半张烟盒纸 to ch2_police_present');
} else {
  assert(false, 'ch2_police should keep onPresent for 半张烟盒纸');
}
assertIncludes(gotos('ch2_police_file'), 'ch2_police_wang', 'ch2_police_file choices before got_wang_note');
assertIncludes(gotos('ch2_police_file', { flags: ['got_wang_note'] }), 'ch2_frenchtown', 'ch2_police_file choices after got_wang_note');
assertIncludes(gotos('ch2_police_file', { flags: ['got_wang_note'] }), 'ch2_home', 'ch2_police_file choices after got_wang_note');
assertIncludes(gotos('ch2_police_file', { flags: ['got_wang_note'] }), 'ch3_school', 'ch2_police_file choices after got_wang_note');
assertIncludes(gotos('ch2_police_alt', { flags: ['got_wang_note'] }), 'ch2_frenchtown', 'ch2_police_alt choices after got_wang_note');

if (typeof context.nodes.ch2_home.onPresent === 'function') {
  resetEvidence();
  const homePresent = context.nodes.ch2_home.onPresent({ name: '苏晚亭的照片' }, E.state);
  assert(homePresent && homePresent.goto === 'ch2_home_showphoto', 'ch2_home onPresent should route 苏晚亭的照片 to ch2_home_showphoto');
} else {
  assert(Boolean(context.nodes.ch2_home_showphoto), 'ch2_home has no onPresent, so ch2_home_showphoto must exist as the final photo route');
  const state = runEffect('ch2_home_showphoto');
  assert(state.items.some(item => item.name === '苏晚亭的银发夹'), 'ch2_home_showphoto should still grant 苏晚亭的银发夹 in final runtime');
  assert(state.clues.some(clue => clue.name === '苏母托付信物'), 'ch2_home_showphoto should still grant 苏母托付信物 in final runtime');
}
assertIncludes(gotos('ch2_home'), 'ch2_home_talk', 'ch2_home early choices');
assertIncludes(gotos('ch2_home'), 'ch2_home_photo', 'ch2_home early choices');
assertIncludes(gotos('ch2_home', { clues: ['母亲证词'], flags: ['asked_photo'] }), 'ch2_leave_home', 'ch2_home completed choices');
assertIncludes(gotos('ch2_leave_home', { clues: ['舍监证词', '法租界地图'], flags: ['asked_door'] }), 'ch2_frenchtown', 'ch2_leave_home final choices');

assertIncludes(gotos('ch2_frenchtown'), 'ch2_building_stakeout', 'ch2_frenchtown initial choices');
assertIncludes(gotos('ch2_frenchtown'), 'ch2_ask_landlord', 'ch2_frenchtown initial choices');
assertIncludes(gotos('ch2_frenchtown'), 'ch2_203_door', 'ch2_frenchtown initial choices');
assertIncludes(gotos('ch2_building_enter'), 'ch2_203_door', 'ch2_building_enter final choices');
resetEvidence();
const buildingPresent = context.nodes.ch2_building_enter.onPresent({ name: '法租界地图' }, E.state);
assert(buildingPresent && buildingPresent.goto === 'ch2_landlord_map', 'ch2_building_enter onPresent should route 法租界地图 to ch2_landlord_map');
assertIncludes(gotos('ch2_203_door'), 'ch2_203_search', 'ch2_203_door before search choices');
assertIncludes(gotos('ch2_203_door', { clues: ['三人合影'] }), 'ch3_school', 'ch2_203_door after search choices');
assertIncludes(gotos('ch2_203_search'), 'ch3_school', 'ch2_203_search choices');

for (const id of expectedChapter2Nodes) {
  for (const goto of gotos(id, { clues: ['舍监证词', '法租界地图', '三人合影'], items: ['三人合影'], flags: ['asked_door', 'asked_photo', 'got_wang_note'] })) {
    assert(context.nodes[goto], `${id} has missing goto target: ${goto}`);
  }
}

if (errors.length) {
  console.error('\nChapter 2 runtime audit failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Chapter 2 runtime audit passed: ${expectedChapter2Nodes.length} nodes checked after full module load.`);
