#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { readPatchSources, runPatchScripts } from './patch-loader.mjs';

const repoRoot = process.cwd();
const errors = [];
const warnings = [];

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
    visitedNodes: {},
    weatherIdx: 0,
    inGameTime: { day: 1, hour: 14, minute: 30 },
    pressure: { heat: 0, deadline: { day: 2, hour: 23, minute: 0 } },
    ...overrides,
  };
}

const E = {
  state: freshState(),
  saveKey: 'story-validation',
  logEl: { innerHTML: '', style: {} },
  sceneEl: { style: {} },
  titleEl: {},
  textEl: {},
  choicesEl: { innerHTML: '', appendChild() {} },
  init() {}, toast() {}, logChoice() {}, logNarration() {}, updateStatus() {}, saveGame() {}, scroll() {}, openPanel() {}, showPresentBtn() {}, applyWeatherClass() {}, ambientLine() {}, openDeduction() {},
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
  setFlag(k, v) { this.state.flags[k] = v; },
  getFlag(k) { return this.state.flags[k]; },
  canDeduce() { return true; },
  caseStrength() { return { name: '自动验收', desc: '自动化校验环境下的案情强度占位。' }; },
};

const domReadyHandlers = [];
const documentStub = {
  addEventListener(event, handler) { if (event === 'DOMContentLoaded') domReadyHandlers.push(handler); },
  getElementById() { return { style: {}, innerHTML: '', textContent: '', appendChild() {}, scrollIntoView() {}, addEventListener() {} }; },
  createElement() { return { className: '', textContent: '', title: '', onclick: null, style: {}, appendChild() {} }; },
};

const context = vm.createContext({
  console,
  E,
  document: documentStub,
  window: {},
  localStorage: { getItem() { return null; }, setItem() {} },
  setTimeout(fn) { if (typeof fn === 'function') fn(); },
  clearTimeout() {},
});
context.globalThis = context;

function runScript(rel, suffix = '') {
  vm.runInContext(read(rel) + suffix, context, { filename: rel });
}

runScript('src/story.js', '\nglobalThis.nodes = nodes;');
runScript('src/main.js');
runPatchScripts(runScript, repoRoot);
for (const handler of domReadyHandlers) handler();

const nodes = context.nodes;
if (!nodes || typeof nodes !== 'object') throw new Error('Unable to load nodes.');

function resetState(overrides = {}) { E.state = freshState(overrides); }
function applyScenario(patch = {}) {
  resetState();
  if (patch.time) E.state.inGameTime = { ...patch.time };
  if (patch.flags) E.state.flags = { ...patch.flags };
  if (patch.items) E.state.items = patch.items.map(name => ({ name, desc: '' }));
  if (patch.clues) E.state.clues = patch.clues.map(name => ({ name, desc: '' }));
}
function assertNode(target, source, kind) {
  if (target && !nodes[target]) errors.push(`${kind}: ${source} -> missing node ${target}`);
}
function choicesFor(node, id) {
  const raw = typeof node.choices === 'function' ? node.choices(E.state) : node.choices;
  if (!raw) return [];
  if (!Array.isArray(raw)) { warnings.push(`${id} choices is ${typeof raw}`); return []; }
  return raw;
}
function visit(id) {
  const node = nodes[id];
  if (!node) throw new Error(`missing node ${id}`);
  E.state.currentScene = id;
  E.state.sceneLog.push(id);
  E.state.visitedNodes[id] = (E.state.visitedNodes[id] || 0) + 1;
  if (typeof node.effect === 'function') node.effect(E.state);
  if (node.time) E.setTime(node.time.d, node.time.h, node.time.m);
  if (node.cost && E.state.visitedNodes[id] <= 1) E.spendTime(node.cost.h || 0, node.cost.m || 0);
  if (typeof node.text === 'function') node.text(E.state);
  return node;
}
function expectEqual(actual, expected, label) {
  if (actual !== expected) errors.push(`${label}: expected ${expected}, got ${actual}`);
}

const scenarios = [
  { name: 'base', time: { day: 1, hour: 14, minute: 30 } },
  { name: 'safe', time: { day: 1, hour: 15, minute: 0 } },
  { name: 'tight', time: { day: 2, hour: 15, minute: 0 } },
  { name: 'critical', time: { day: 2, hour: 21, minute: 0 } },
  { name: 'expired', time: { day: 3, hour: 0, minute: 0 } },
  { name: 'with-sun-support', time: { day: 2, hour: 15, minute: 0 }, flags: { sun_support_available: true, sun_fast_support: true } },
  { name: 'with-iron', time: { day: 2, hour: 15, minute: 0 }, items: ['铁钎'] },
  { name: 'with-su-found', time: { day: 2, hour: 15, minute: 0 }, flags: { found_su_at_dock: true, rescued_su: true } },
];

for (const [id, node] of Object.entries(nodes)) {
  for (const scenario of scenarios) {
    applyScenario(scenario);
    try { if (typeof node.text === 'function') node.text(E.state); } catch (err) { errors.push(`text failed: ${id}/${scenario.name}: ${err.message}`); }
    try {
      for (const choice of choicesFor(node, id)) {
        if (typeof choice.goto === 'string') assertNode(choice.goto, id, 'choice.goto');
        if (typeof choice.goto === 'function') {
          try { assertNode(choice.goto(E.state), `${id}/${choice.text || 'unnamed'}/${scenario.name}`, 'choice.goto(fn)'); }
          catch (err) { errors.push(`goto function failed: ${id}/${scenario.name}: ${err.message}`); }
        }
      }
    } catch (err) { errors.push(`choices failed: ${id}/${scenario.name}: ${err.message}`); }
    try { if (typeof node.auto === 'function') assertNode(node.auto(E.state), `${id}/${scenario.name}`, 'auto'); }
    catch (err) { errors.push(`auto failed: ${id}/${scenario.name}: ${err.message}`); }
  }
}

const sourceText = [read('src/story.js'), read('src/main.js'), readPatchSources(read, repoRoot)].join('\n');
const itemNames = [...new Set([
  ...[...sourceText.matchAll(/E\.addItem\(['"`]([^'"`]+)['"`]/g)].map(m => m[1]),
  '半张烟盒纸', '福生仓地址', '翡翠镯', '三人合影', '陈明远的信', '未寄出的信', '铁钎', '光华货运单', '清场指令'
])];

for (const [id, node] of Object.entries(nodes)) {
  if (typeof node.onPresent !== 'function') continue;
  for (const itemName of itemNames) {
    resetState();
    try {
      const result = node.onPresent({ name: itemName, desc: '' }, E.state);
      if (result && result.goto) assertNode(result.goto, `${id}/present ${itemName}`, 'onPresent');
    } catch (err) { errors.push(`onPresent failed: ${id}/${itemName}: ${err.message}`); }
  }
}

try {
  resetState({ inGameTime: { day: 1, hour: 14, minute: 30 }, pressure: { heat: 0, deadline: { day: 2, hour: 23, minute: 0 } }, visitedNodes: {}, sceneLog: [] });
  visit('ch4_suzhou_creek'); expectEqual(E.routeDockByPressure(), 'ch4_dock_full_search', 'safe routeDockByPressure');
  visit('ch4_dock_full_search'); visit('ch4_dock_crates'); visit('ch4_dock_locked_door');
  expectEqual(E.routeDockDeepByPressure(), 'ch4_dock_deep_dual', 'safe routeDockDeepByPressure');

  resetState({ inGameTime: { day: 2, hour: 14, minute: 0 }, pressure: { heat: 0, deadline: { day: 2, hour: 23, minute: 0 } }, visitedNodes: {}, sceneLog: [] });
  visit('ch4_suzhou_creek'); expectEqual(E.routeDockByPressure(), 'ch4_dock_limited_search', 'tight routeDockByPressure');
  visit('ch4_dock_limited_search'); visit('ch4_dock_crates'); visit('ch4_dock_locked_door');
  expectEqual(E.routeDockDeepByPressure(), 'ch4_dock_deep_trace', 'tight routeDockDeepByPressure');

  resetState({ inGameTime: { day: 2, hour: 20, minute: 30 }, pressure: { heat: 0, deadline: { day: 2, hour: 23, minute: 0 } }, visitedNodes: {}, sceneLog: [] });
  visit('ch4_suzhou_creek'); expectEqual(E.routeDockByPressure(), 'ch4_dock_rescue_only', 'critical routeDockByPressure');
  visit('ch4_dock_rescue_only'); expectEqual(E.routeDockDeepByPressure(), 'ch4_dock_deep_rescue_only', 'critical routeDockDeepByPressure');

  resetState({ inGameTime: { day: 2, hour: 23, minute: 30 }, pressure: { heat: 0, deadline: { day: 2, hour: 23, minute: 0 } }, visitedNodes: {}, sceneLog: [] });
  visit('ch4_suzhou_creek'); expectEqual(E.routeDockByPressure(), 'ch4_dock_cleared', 'expired routeDockByPressure');
} catch (err) { errors.push(`pressure smoke failed: ${err.message}`); }

const staticGotoMatches = [...sourceText.matchAll(/goto:\s*['"`]([^'"`]+)['"`]/g)].map(m => m[1]);
for (const target of staticGotoMatches) assertNode(target, 'source-regex', 'static goto');

console.log(`Story validation: ${Object.keys(nodes).length} nodes, ${itemNames.length} present-items checked.`);
if (warnings.length) {
  console.log('\nWarnings:');
  for (const warning of warnings) console.log(`- ${warning}`);
}
if (errors.length) {
  console.error('\nValidation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('Validation passed.');
