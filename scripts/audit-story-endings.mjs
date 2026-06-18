#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { runStoryModuleScripts } from './story-module-loader.mjs';

const repoRoot = process.cwd();
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
  saveKey: 'story-endings-audit',
  logEl: { innerHTML: '', style: {} },
  sceneEl: { style: {} },
  titleEl: {},
  textEl: {},
  choicesEl: { innerHTML: '', appendChild() {} },
  init() {}, toast() {}, logChoice() {}, logNarration() {}, updateStatus() {}, saveGame() {}, scroll() {}, openPanel() {}, showPresentBtn() {}, applyWeatherClass() {}, ambientLine() {}, openDeduction() {},
  freshState() { return freshState(); },
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
  setFlag(k, v) { this.state.flags[k] = v; },
  getFlag(k) { return this.state.flags[k]; },
  canDeduce() { return true; },
  caseStrength() { return { name: '自动审计', desc: '自动化审计环境下的案情强度占位。' }; },
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
    errors.push(`${rel}: ${error.message}`);
  }
}

runScript('src/story.js', '\nglobalThis.nodes = nodes;');
runScript('src/main.js');
runStoryModuleScripts(runScript, repoRoot);
for (const handler of domReadyHandlers) {
  try { handler(); } catch (error) { errors.push(`DOMContentLoaded handler: ${error.message}`); }
}

if (errors.length) {
  console.error('\nStory endings audit failed to load runtime:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const nodes = context.nodes;
if (!nodes || typeof nodes !== 'object') {
  console.error('Unable to load nodes.');
  process.exit(1);
}

const endings = Object.entries(nodes)
  .filter(([, node]) => node && node.type === 'end')
  .map(([id, node]) => ({ id, title: node.title || '', hasText: typeof node.text === 'function' || typeof node.text === 'string' }))
  .sort((a, b) => a.id.localeCompare(b.id));

const expectedStaticIds = new Set([
  'end_refuse',
  'end_archive',
  'end_too_late',
  'end_boss_lu',
  'end_boss_zhao',
  'end_boss_wu',
  'end_conspiracy',
  'end_rescue',
  'end_conspiracy_detail',
]);

const missingText = endings.filter(item => !item.hasText);
if (missingText.length) {
  console.error('\nEnding nodes missing text:');
  for (const item of missingText) console.error(`- ${item.id}`);
  process.exit(1);
}

console.log(`Story ending audit passed: ${endings.length} runtime ending nodes.`);
for (const item of endings) {
  const source = expectedStaticIds.has(item.id) ? 'story-chapters/endings.js static' : 'runtime/dynamic module';
  console.log(`- ${item.id} | ${item.title} | ${source}`);
}
