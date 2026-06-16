#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { listPatchScripts, runPatchScripts } from './patch-loader.mjs';

const repoRoot = process.cwd();
const errors = [];

function read(rel) {
  return fs.readFileSync(path.join(repoRoot, rel), 'utf8');
}

function assert(condition, message) {
  if (!condition) errors.push(message);
}

const indexHtml = read('index.html');
assert(indexHtml.includes('src/patches.js'), 'index.html 应只加载 src/patches.js 作为补丁入口');
const directPatchScripts = [...indexHtml.matchAll(/src="(src\/[^"]+\.js)"/g)]
  .map(m => m[1])
  .filter(src => src !== 'src/engine.js' && src !== 'src/story.js' && src !== 'src/main.js' && src !== 'src/patches.js');
assert(directPatchScripts.length === 0, `index.html 不应直接加载补丁脚本：${directPatchScripts.join(', ')}`);

const patchesJs = read('src/patches.js');
const manifestPatches = [];
for (const quote of ["'", '"']) {
  for (const part of patchesJs.split(quote)) {
    if (part.startsWith('src/') && part.endsWith('.js') && part !== 'src/patches.js') manifestPatches.push(part);
  }
}
const uniqueManifestPatches = [...new Set(manifestPatches)];
const discoveredPatches = listPatchScripts(repoRoot);

assert(uniqueManifestPatches.length > 0, 'src/patches.js 中没有登记任何补丁或稳定模块');
assert(
  JSON.stringify(uniqueManifestPatches) === JSON.stringify(discoveredPatches),
  `补丁清单不一致：\n  patches.js=${uniqueManifestPatches.join(', ')}\n  loader=${discoveredPatches.join(', ')}`
);

function freshState() {
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
    inGameTime: { day: 2, hour: 21, minute: 0 },
    pressure: { heat: 0, deadline: { day: 2, hour: 23, minute: 0 } },
  };
}

const E = {
  state: freshState(),
  saveKey: 'patch-loading-check',
  logEl: { innerHTML: '', style: {} },
  sceneEl: { style: {} },
  titleEl: {},
  textEl: {},
  choicesEl: { innerHTML: '', appendChild() {} },
  init() {}, toast() {}, logChoice() {}, logNarration() {}, updateStatus() {}, saveGame() {}, scroll() {}, openPanel() {}, showPresentBtn() {}, applyWeatherClass() {}, ambientLine() {}, openDeduction() {},
  setWeather(i) { this.state.weatherIdx = i; },
  renderAtmosphere() { return ''; },
  setTime(day, hour, minute) { this.state.inGameTime = { day: day || 1, hour: hour || 14, minute: minute || 0 }; },
  timeToMinutes(t) { return (t.day || 1) * 24 * 60 + (t.hour || 0) * 60 + (t.minute || 0); },
  minutesUntilDeadline() { return this.timeToMinutes(this.state.pressure.deadline) - this.timeToMinutes(this.state.inGameTime); },
  advanceTime(hours = 0, minutes = 0) {
    const t = this.state.inGameTime;
    t.minute += minutes;
    t.hour += hours;
    while (t.minute >= 60) { t.minute -= 60; t.hour += 1; }
    while (t.hour >= 24) { t.hour -= 24; t.day += 1; }
  },
  spendTime(hours = 0, minutes = 0) { this.advanceTime(hours, minutes); this.checkDeadline(); },
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
  caseStrength() { return { name: '补丁加载检查', desc: '补丁加载一致性检查占位。' }; },
};

const domReadyHandlers = [];
const documentStub = {
  addEventListener(event, handler) { if (event === 'DOMContentLoaded') domReadyHandlers.push(handler); },
  getElementById() { return { style: {}, innerHTML: '', textContent: '', appendChild() {}, scrollIntoView() {}, addEventListener() {} }; },
  createElement() { return { className: '', textContent: '', title: '', onclick: null, style: {}, appendChild() {} }; },
  write() {},
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
  const code = read(rel) + suffix;
  vm.runInContext(code, context, { filename: rel });
}

runScript('src/story.js', '\nglobalThis.nodes = nodes;');
runScript('src/main.js');
runPatchScripts(runScript, repoRoot);
for (const handler of domReadyHandlers) handler();

const nodes = context.nodes;
assert(nodes && typeof nodes === 'object', '补丁加载后无法获得 nodes');
assert(typeof E.v07ResolveEnding === 'function', '补丁加载后缺少 E.v07ResolveEnding');
assert(typeof E.v07InvestigationQuality === 'function', '补丁加载后缺少 E.v07InvestigationQuality');
for (const nodeId of ['ch4_hospital_conflict', 'ch4_lu_confrontation', 'ch4_fu_private_offer', 'ch4_zhou_present_diary', 'ch4_sun_present_waybill']) {
  assert(nodes[nodeId], `补丁加载后缺少节点：${nodeId}`);
}

if (errors.length) {
  console.error('\nPatch loading check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Patch loading check passed: ${discoveredPatches.length} scripts loaded.`);
