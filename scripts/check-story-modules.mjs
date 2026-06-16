#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { STORY_MODULE_ENTRY, listStoryModuleScripts, runStoryModuleScripts } from './story-module-loader.mjs';

const repoRoot = process.cwd();
const errors = [];

function read(rel) {
  return fs.readFileSync(path.join(repoRoot, rel), 'utf8');
}

function exists(rel) {
  return fs.existsSync(path.join(repoRoot, rel));
}

function assert(condition, message) {
  if (!condition) errors.push(message);
}

const indexHtml = read('index.html');
assert(indexHtml.includes(STORY_MODULE_ENTRY), 'index.html 应加载 src/story-modules.js 作为故事模块入口');
assert(!indexHtml.includes('src/patches.js'), 'index.html 不应继续加载 src/patches.js');
assert(!exists('src/patches.js'), 'src/patches.js 已退役，不应再次出现');

const directStoryScripts = [...indexHtml.matchAll(/src="(src\/[^"]+\.js)"/g)]
  .map(m => m[1])
  .filter(src => src !== 'src/engine.js' && src !== 'src/story.js' && src !== 'src/main.js' && src !== STORY_MODULE_ENTRY);
assert(directStoryScripts.length === 0, `index.html 不应直接加载故事模块：${directStoryScripts.join(', ')}`);

const srcFiles = fs.readdirSync(path.join(repoRoot, 'src'));
const versionPatchFiles = srcFiles.filter(name => /^v\d+(?:\.\d+)*-.+\.js$/.test(name));
assert(versionPatchFiles.length === 0, `src/v*.js 版本补丁已退役，不应再次出现：${versionPatchFiles.join(', ')}`);

const modulesJs = read(STORY_MODULE_ENTRY);
const manifestModules = [];
for (const quote of ["'", '"']) {
  for (const part of modulesJs.split(quote)) {
    if (part.startsWith('src/') && part.endsWith('.js') && part !== STORY_MODULE_ENTRY) manifestModules.push(part);
  }
}
const uniqueManifestModules = [...new Set(manifestModules)];
const discoveredModules = listStoryModuleScripts(repoRoot);

assert(uniqueManifestModules.length > 0, 'src/story-modules.js 中没有登记任何故事模块');
assert(
  JSON.stringify(uniqueManifestModules) === JSON.stringify(discoveredModules),
  `故事模块清单不一致：\n  story-modules.js=${uniqueManifestModules.join(', ')}\n  loader=${discoveredModules.join(', ')}`
);

for (const rel of discoveredModules) {
  assert(exists(rel), `故事模块不存在：${rel}`);
  assert(!/^src\/v\d+(?:\.\d+)*-.+\.js$/.test(rel), `故事模块不应使用版本补丁命名：${rel}`);
}

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

const noopEl = () => ({
  style: {},
  innerHTML: '',
  textContent: '',
  className: '',
  title: '',
  onclick: null,
  appendChild() {},
  insertAdjacentElement() {},
  scrollIntoView() {},
  addEventListener() {},
  classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
});

const E = {
  state: freshState(),
  saveKey: 'story-module-check',
  logEl: noopEl(),
  sceneEl: noopEl(),
  titleEl: noopEl(),
  textEl: noopEl(),
  choicesEl: noopEl(),
  relationData: { nodes: [] },
  panelTab: 'overview',
  panelListPages: {},
  init() {}, toast() {}, logChoice() {}, logNarration() {}, updateStatus() {}, saveGame() {}, scroll() {}, openPanel() {}, openGraph() {}, showPresentBtn() {}, applyWeatherClass() {}, ambientLine() {}, openDeduction() {},
  setWeather(i) { this.state.weatherIdx = i; },
  renderAtmosphere() { return ''; },
  renderPanel() {},
  setTime(day, hour, minute) { this.state.inGameTime = { day: day || 1, hour: hour || 14, minute: minute || 0 }; },
  timeToMinutes(t) { return (t.day || 1) * 24 * 60 + (t.hour || 0) * 60 + (t.minute || 0); },
  minutesUntilDeadline() { return this.timeToMinutes(this.state.pressure.deadline) - this.timeToMinutes(this.state.inGameTime); },
  pressureLabel() { return '剩余时间检查占位'; },
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
  caseStrength() { return { name: '故事模块检查', desc: '故事模块加载一致性检查占位。' }; },
  renderClueWall() { return ''; },
};

const domReadyHandlers = [];
const documentStub = {
  body: noopEl(),
  addEventListener(event, handler) { if (event === 'DOMContentLoaded') domReadyHandlers.push(handler); },
  getElementById() { return noopEl(); },
  createElement() { return noopEl(); },
  write() {},
};

const context = vm.createContext({
  console,
  E,
  document: documentStub,
  window: { matchMedia() { return { matches: false }; } },
  localStorage: { getItem() { return null; }, setItem() {} },
  setTimeout(fn) { if (typeof fn === 'function') fn(); },
  clearTimeout() {},
});
context.globalThis = context;

function runScript(rel, suffix = '') {
  try {
    const code = read(rel) + suffix;
    vm.runInContext(code, context, { filename: rel });
  } catch (err) {
    errors.push(`脚本加载失败 ${rel}: ${err.message}`);
  }
}

runScript('src/story.js', '\nglobalThis.nodes = nodes;');
runScript('src/main.js');
runStoryModuleScripts(runScript, repoRoot);
for (const handler of domReadyHandlers) {
  try { handler(); }
  catch (err) { errors.push(`DOMContentLoaded handler failed: ${err.message}`); }
}

const nodes = context.nodes;
assert(nodes && typeof nodes === 'object', '故事模块加载后无法获得 nodes');
assert(typeof E.v07ResolveEnding === 'function', '故事模块加载后缺少 E.v07ResolveEnding');
assert(typeof E.v07InvestigationQuality === 'function', '故事模块加载后缺少 E.v07InvestigationQuality');
for (const nodeId of ['ch4_hospital_conflict', 'ch4_lu_confrontation', 'ch4_fu_private_offer', 'ch4_zhou_present_diary', 'ch4_sun_present_waybill']) {
  assert(nodes && nodes[nodeId], `故事模块加载后缺少节点：${nodeId}`);
}

if (errors.length) {
  console.error('\nStory module contract check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Story module contract check passed: ${discoveredModules.length} modules loaded.`);
