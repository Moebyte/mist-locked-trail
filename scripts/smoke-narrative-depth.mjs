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
    inGameTime: { day: 2, hour: 21, minute: 0 },
    pressure: { heat: 0, deadline: { day: 2, hour: 23, minute: 0 } },
    ...overrides,
  };
}

const E = {
  state: freshState(),
  saveKey: 'narrative-depth-smoke-test',
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
  caseStrength() { return { name: '自动剧情密度验收', desc: 'v0.7 烟测下的案情强度占位。' }; },
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
for (const rel of ['src/v0.6.1-fixes.js', 'src/v0.6.2-evidence.js', 'src/v0.6.3-evidence-polish.js', 'src/v0.7-narrative-depth.js']) {
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
  if (node.time) E.setTime(node.time.d, node.time.h, node.time.m);
  if (node.cost && E.state.visitedNodes[id] <= 1) E.spendTime(node.cost.h || 0, node.cost.m || 0, node.cost.reason || '调查耗时');
  if (typeof node.text === 'function') node.text(E.state);
  return node;
}

function choicesOf(id) {
  const node = nodes[id];
  const choices = typeof node.choices === 'function' ? node.choices(E.state) : node.choices;
  return Array.isArray(choices) ? choices : [];
}

function runChoice(choice, expectedText = '选项') {
  if (!choice) throw new Error(`找不到${expectedText}`);
  if (choice.when && !choice.when(E.state)) throw new Error(`${expectedText} 条件未满足`);
  if (typeof choice.effect === 'function') choice.effect(E.state);
  const next = typeof choice.goto === 'function' ? choice.goto(E.state) : choice.goto;
  renderNode(next);
  return next;
}

function goByTarget(target) {
  const current = E.state.currentScene;
  const choice = choicesOf(current).find(c => c.goto === target || (typeof c.goto === 'function' && c.goto(E.state) === target));
  return runChoice(choice, `通往 ${target} 的选项`);
}

function goByText(textFragment) {
  const current = E.state.currentScene;
  const choice = choicesOf(current).find(c => c.text && c.text.includes(textFragment));
  return runChoice(choice, `包含「${textFragment}」的选项`);
}

function assertFlag(flag, value = true) {
  if (E.state.flags[flag] !== value) throw new Error(`flag ${flag} 预期 ${value}，实际 ${E.state.flags[flag]}`);
}

function assertClue(name) {
  if (!E.state.clues.some(c => c.name === name)) throw new Error(`缺少线索：${name}`);
}

function assertChoiceTarget(sceneId, target) {
  renderNode(sceneId);
  const ok = choicesOf(sceneId).some(c => c.goto === target || (typeof c.goto === 'function' && c.goto(E.state) === target));
  if (!ok) throw new Error(`${sceneId} 缺少通往 ${target} 的选择`);
}

function testHospitalConflict() {
  resetState({ flags: { found_su_at_dock: true, deduced_fusheng: true } });
  renderNode('ch4_dock_escape_finish');
  assertFlag('rescued_yufang');
  assertFlag('rescued_su');
  goByTarget('ch4_hospital_conflict');
  assertFlag('v07_triangle_conflict_seen');
  assertClue('医院走廊冲突');
  const targets = choicesOf('ch4_hospital_conflict').map(c => typeof c.goto === 'function' ? c.goto(E.state) : c.goto);
  for (const target of ['ch4_hospital_protect_witnesses', 'ch4_hospital_pressure_fu', 'ch4_lu_confrontation']) {
    if (!targets.includes(target)) throw new Error(`医院冲突缺少分支：${target}`);
  }
  reports.push('PASS 医院走廊三方冲突入口与三分支');
}

function testHighQualityNaturalEnding() {
  resetState({ flags: { found_su_at_dock: true, deduced_fusheng: true, fu_waybill_exposed: true, fu_clearance_exposed: true } });
  renderNode('ch4_dock_escape_finish');
  goByTarget('ch4_hospital_conflict');
  goByTarget('ch4_hospital_protect_witnesses');
  assertFlag('v07_witnesses_protected');
  goByTarget('ch4_lu_confrontation');
  assertFlag('v07_lu_confronted');
  goByTarget('ch4_fu_private_offer');
  assertFlag('v07_lu_statement');
  goByText('拒绝交易');
  assertFlag('v07_rejected_fu_deal');
  const quality = E.v07InvestigationQuality();
  if (quality.score < 10) throw new Error(`高质量路线分数过低：${quality.score}`);
  const ending = E.v07ResolveEnding();
  if (ending !== 'end_conspiracy_detail') throw new Error(`高质量路线预期隐藏结局，实际 ${ending}`);
  reports.push(`PASS 高质量路线自然分流到 ${ending}，score=${quality.score}`);
}

function testLateNaturalEnding() {
  resetState({ flags: { missed_deadline: true } });
  const ending = E.v07ResolveEnding();
  if (ending !== 'end_too_late') throw new Error(`超期路线预期 end_too_late，实际 ${ending}`);
  reports.push('PASS 超期状态自然分流到 end_too_late');
}

function testFuOfferBranches() {
  resetState({ flags: { fu_waybill_exposed: true } });
  renderNode('ch4_fu_private_offer');
  const targets = choicesOf('ch4_fu_private_offer').map(c => typeof c.goto === 'function' ? c.goto(E.state) : c.goto);
  if (!targets.includes('ch4_conclusion')) throw new Error('傅启元交易节点缺少回到结案的选择');
  const pressChoice = choicesOf('ch4_fu_private_offer').find(c => c.text.includes('申报'));
  if (!pressChoice || (pressChoice.when && !pressChoice.when(E.state))) throw new Error('掌握证据时应允许用《申报》和老孙反制傅启元');
  reports.push('PASS 傅启元私下交易节点具备反制分支');
}

try {
  assertChoiceTarget('ch4_conclusion', 'end_archive');
  testHospitalConflict();
  testHighQualityNaturalEnding();
  testLateNaturalEnding();
  testFuOfferBranches();
} catch (err) {
  errors.push(err.message);
}

console.log('Narrative depth smoke reports:');
for (const report of reports) console.log(`- ${report}`);

if (errors.length) {
  console.error('\nNarrative depth smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Narrative depth smoke passed: ${reports.length} checks.`);
