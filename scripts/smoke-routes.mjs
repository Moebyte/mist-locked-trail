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
    inGameTime: { day: 1, hour: 14, minute: 30 },
    pressure: { heat: 0, deadline: { day: 2, hour: 23, minute: 0 } },
    ...overrides,
  };
}

const E = {
  state: freshState(),
  saveKey: 'route-smoke-test',
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
  caseStrength() { return { name: '自动路线验收', desc: '路线 smoke test 的案情强度占位。' }; },
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
if (exists('src/v0.6.1-fixes.js')) runScript('src/v0.6.1-fixes.js');
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
  if (node.time) E.setTime(node.time.d, node.time.h, node.time.m);
  if (node.cost && E.state.visitedNodes[id] <= 1) E.spendTime(node.cost.h || 0, node.cost.m || 0, node.cost.reason || '调查耗时');
  if (typeof node.text === 'function') node.text(E.state);
  return node;
}

function choicesOf(node) {
  const choices = typeof node.choices === 'function' ? node.choices(E.state) : node.choices;
  return Array.isArray(choices) ? choices : [];
}

function chooseByTarget(node, target) {
  const choices = choicesOf(node);
  const choice = choices.find(c => c.goto === target || (typeof c.goto === 'function' && c.goto(E.state) === target));
  if (!choice) throw new Error(`在 ${E.state.currentScene} 找不到通往 ${target} 的选项`);
  if (typeof choice.effect === 'function') choice.effect(E.state);
  return typeof choice.goto === 'function' ? choice.goto(E.state) : choice.goto;
}

function play(name, initialState, steps) {
  resetState(initialState);
  const visited = [];
  let current = null;
  try {
    for (const step of steps) {
      if (typeof step === 'string') {
        current = step;
        renderNode(current);
        visited.push(current);
        continue;
      }
      if (step.setTime) {
        E.state.inGameTime = { ...step.setTime };
        continue;
      }
      if (step.expectRoute) {
        const actual = step.fn();
        if (actual !== step.expectRoute) throw new Error(`${step.label} 预期 ${step.expectRoute}，实际 ${actual}`);
        current = actual;
        renderNode(current);
        visited.push(current);
        continue;
      }
      if (step.goto) {
        if (!current) throw new Error(`无法选择 ${step.goto}：尚未进入任何场景`);
        const node = nodes[current];
        const target = chooseByTarget(node, step.goto);
        current = target;
        renderNode(current);
        visited.push(current);
        continue;
      }
      if (step.expect) {
        step.expect(E.state);
        continue;
      }
      throw new Error(`未知步骤：${JSON.stringify(step)}`);
    }
    reports.push({ name, ok: true, visited, flags: { ...E.state.flags } });
  } catch (err) {
    errors.push(`${name}: ${err.message}\n  visited: ${visited.join(' -> ')}`);
  }
}

function assertFlag(flag, value = true) {
  return (s) => {
    if (s.flags[flag] !== value) throw new Error(`flag ${flag} 预期 ${value}，实际 ${s.flags[flag]}`);
  };
}

function assertItem(name) {
  return (s) => {
    if (!s.items.some(i => i.name === name)) throw new Error(`缺少物品：${name}`);
  };
}

function assertClue(name) {
  return (s) => {
    if (!s.clues.some(c => c.name === name)) throw new Error(`缺少线索：${name}`);
  };
}

function assertSceneContains(id) {
  return (s) => {
    if (!s.sceneLog.includes(id)) throw new Error(`路线未经过场景：${id}`);
  };
}

const basePressure = { heat: 0, deadline: { day: 2, hour: 23, minute: 0 } };
const suTrust = { presented_su_keepsake: true };
const suTrustClues = [{ name: '苏晚亭认出银发夹', desc: '' }];

play('早到路线：完整搜证并救出苏晚亭和沈玉芳',
  { inGameTime: { day: 1, hour: 14, minute: 30 }, pressure: structuredClone(basePressure), flags: { ...suTrust }, clues: suTrustClues },
  [
    'ch4_suzhou_creek',
    { expectRoute: 'ch4_dock_full_search', label: 'safe routeDockByPressure', fn: () => E.routeDockByPressure() },
    { goto: 'ch4_dock_crates' },
    { goto: 'ch4_dock_hide' },
    { goto: 'ch4_dock_locked_door' },
    { expectRoute: 'ch4_dock_deep_dual', label: 'safe routeDockDeepByPressure', fn: () => E.routeDockDeepByPressure() },
    { goto: 'ch4_dock_who_dual' },
    { goto: 'ch4_dock_escape' },
    { goto: 'ch4_dock_escape_finish' },
    { expect: assertFlag('rescued_su') },
    { expect: assertFlag('rescued_yufang') },
    { expect: assertFlag('found_su_at_dock') },
    { expect: assertItem('光华货运单') },
    { expect: assertClue('苏晚亭在场') },
  ]
);

play('晚到路线：有限搜查，只救沈玉芳并发现苏晚亭刚被转走',
  { inGameTime: { day: 2, hour: 14, minute: 0 }, pressure: structuredClone(basePressure) },
  [
    'ch4_suzhou_creek',
    { expectRoute: 'ch4_dock_limited_search', label: 'tight routeDockByPressure', fn: () => E.routeDockByPressure() },
    { goto: 'ch4_dock_locked_door' },
    { expectRoute: 'ch4_dock_deep_trace', label: 'tight routeDockDeepByPressure', fn: () => E.routeDockDeepByPressure() },
    { goto: 'ch4_dock_who' },
    { goto: 'ch4_dock_escape' },
    { goto: 'ch4_dock_escape_finish' },
    { expect: assertFlag('rescued_yufang') },
    { expect: assertFlag('su_moved_from_dock') },
    { expect: assertItem('苏晚亭学生证') },
    { expect: assertClue('苏晚亭曾在暗室') },
  ]
);

play('临界路线：只够救沈玉芳，只拿到苏晚亭手表',
  { inGameTime: { day: 2, hour: 20, minute: 30 }, pressure: structuredClone(basePressure) },
  [
    'ch4_suzhou_creek',
    { expectRoute: 'ch4_dock_rescue_only', label: 'critical routeDockByPressure', fn: () => E.routeDockByPressure() },
    { goto: 'ch4_dock_deep_rescue_only' },
    { goto: 'ch4_dock_who' },
    { goto: 'ch4_dock_escape' },
    { goto: 'ch4_dock_escape_finish' },
    { expect: assertFlag('rescued_yufang') },
    { expect: assertFlag('su_trace_only') },
    { expect: assertItem('苏晚亭手表') },
    { expect: assertClue('苏晚亭手表') },
  ]
);

play('超期路线：福生仓清场，只剩残留字条',
  { inGameTime: { day: 2, hour: 23, minute: 30 }, pressure: structuredClone(basePressure) },
  [
    'ch4_suzhou_creek',
    { expectRoute: 'ch4_dock_cleared', label: 'expired routeDockByPressure', fn: () => E.routeDockByPressure() },
    { expect: assertFlag('missed_deadline') },
    { expect: assertItem('苏晚亭半张字条') },
    { expect: assertClue('福生仓清场') },
  ]
);

play('有老孙支援路线：傅启元对峙不丢失支援逻辑',
  { inGameTime: { day: 2, hour: 14, minute: 0 }, pressure: structuredClone(basePressure), flags: { sun_support_available: true, sun_fast_support: true, found_su_at_dock: true, ...suTrust }, clues: suTrustClues },
  [
    'ch4_dock_escape',
    { goto: 'ch4_fu_confront' },
    { goto: 'ch4_dock_escape_finish' },
    { expect: assertFlag('confronted_fu') },
    { expect: assertFlag('rescued_su') },
    { expect: assertSceneContains('ch4_fu_confront') },
  ]
);

play('无老孙支援路线：傅启元对峙后仍可撤走',
  { inGameTime: { day: 2, hour: 14, minute: 0 }, pressure: structuredClone(basePressure), flags: { found_su_at_dock: true, ...suTrust }, clues: suTrustClues },
  [
    'ch4_dock_escape',
    { goto: 'ch4_fu_confront' },
    { goto: 'ch4_dock_escape_finish' },
    { expect: assertFlag('confronted_fu') },
    { expect: assertFlag('rescued_su') },
    { expect: assertSceneContains('ch4_fu_confront') },
  ]
);

console.log('Route smoke reports:');
for (const report of reports) {
  console.log(`- PASS ${report.name}: ${report.visited.join(' -> ')}`);
}

if (errors.length) {
  console.error('\nRoute smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Route smoke passed: ${reports.length} routes.`);
