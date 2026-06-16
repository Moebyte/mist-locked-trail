#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const repoRoot = process.cwd();
const errors = [];
const reports = [];

function exists(rel) {
  return fs.existsSync(path.join(repoRoot, rel));
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
    inGameTime: { day: 2, hour: 14, minute: 0 },
    pressure: { heat: 0, deadline: { day: 2, hour: 23, minute: 0 } },
    ...overrides,
  };
}

const E = {
  state: freshState(),
  saveKey: 'evidence-smoke-test',
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
    t.minute += minutes;
    t.hour += hours;
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
  caseStrength() { return { name: '自动举证验收', desc: '举证 smoke test 的案情强度占位。' }; },
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
  const file = path.join(repoRoot, rel);
  const code = fs.readFileSync(file, 'utf8') + suffix;
  vm.runInContext(code, context, { filename: rel });
}

runScript('src/story.js', '\nglobalThis.nodes = nodes;');
runScript('src/main.js');
for (const rel of ['src/v0.6.1-fixes.js', 'src/v0.6.2-evidence.js']) {
  if (exists(rel)) runScript(rel);
}
for (const handler of domReadyHandlers) handler();

const nodes = context.nodes;
if (!nodes || typeof nodes !== 'object') throw new Error('无法加载 nodes。');

function resetState(overrides = {}) {
  E.state = freshState(overrides);
}

function renderNode(id) {
  const node = nodes[id];
  if (!node) throw new Error(`场景丢失：${id}`);
  E.state.currentScene = id;
  E.state.sceneLog.push(id);
  E.state.visitedNodes[id] = (E.state.visitedNodes[id] || 0) + 1;
  if (typeof node.effect === 'function') node.effect(E.state);
  if (typeof node.text === 'function') node.text(E.state);
  return node;
}

function expectNode(id) {
  if (!nodes[id]) throw new Error(`缺少举证结果节点：${id}`);
}

function smokePresent(name, sceneId, itemName, expectedGoto, expectations = []) {
  resetState({
    flags: { found_su_at_dock: true, sun_support_available: true, sun_fast_support: true },
    items: [{ name: itemName, desc: '' }],
  });
  try {
    const scene = renderNode(sceneId);
    if (typeof scene.onPresent !== 'function') throw new Error(`${sceneId} 没有 onPresent`);
    const result = scene.onPresent({ name: itemName, desc: '' }, E.state);
    if (!result || result.goto !== expectedGoto) {
      throw new Error(`${sceneId} 出示 ${itemName} 预期跳到 ${expectedGoto}，实际 ${result ? result.goto : 'null'}`);
    }
    expectNode(result.goto);
    renderNode(result.goto);
    for (const check of expectations) check(E.state);
    reports.push(`PASS ${name}: ${sceneId} + ${itemName} -> ${expectedGoto}`);
  } catch (err) {
    errors.push(`${name}: ${err.message}`);
  }
}

function expectFlag(flag, value = true) {
  return (s) => {
    if (s.flags[flag] !== value) throw new Error(`flag ${flag} 预期 ${value}，实际 ${s.flags[flag]}`);
  };
}

function expectClue(name) {
  return (s) => {
    if (!s.clues.some(c => c.name === name)) throw new Error(`缺少线索：${name}`);
  };
}

smokePresent('傅启元举证：福生仓地址', 'ch4_fu_confront', '福生仓地址', 'ch4_fu_present_address', [
  expectClue('傅启元与福生仓'),
]);
smokePresent('傅启元举证：光华货运单', 'ch4_fu_confront', '光华货运单', 'ch4_fu_present_waybill', [
  expectFlag('fu_waybill_exposed'),
  expectClue('傅启元货运单破绽'),
]);
smokePresent('傅启元举证：清场指令', 'ch4_fu_confront', '清场指令', 'ch4_fu_present_clearance', [
  expectFlag('fu_clearance_exposed'),
  expectClue('傅启元清场指令破绽'),
]);
smokePresent('沈玉芳双人获救举证：三人合影', 'ch4_dock_who_dual', '三人合影', 'ch4_yufang_present_photo_dual', [
  expectClue('沈玉芳认出三人合影'),
]);
smokePresent('沈玉芳双人获救举证：陈明远的信', 'ch4_dock_who_dual', '陈明远的信', 'ch4_yufang_present_letter_dual', [
  expectClue('沈玉芳确认陈明远求助'),
]);
smokePresent('沈玉芳双人获救举证：日记残页', 'ch4_dock_who_dual', '日记残页', 'ch4_yufang_present_diary_dual', [
  expectClue('沈玉芳读到苏晚亭日记'),
]);

console.log('Evidence smoke reports:');
for (const report of reports) console.log(`- ${report}`);

if (errors.length) {
  console.error('\nEvidence smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Evidence smoke passed: ${reports.length} interactions.`);
