import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { runStoryModuleScripts } from './story-module-loader.mjs';

export function freshState(overrides = {}) {
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

export function createEngineStub(initialState = {}) {
  const E = {
    state: freshState(initialState),
    saveKey: 'story-harness',
    logEl: { innerHTML: '', style: {} },
    sceneEl: { style: {} },
    titleEl: {},
    textEl: {},
    choicesEl: { innerHTML: '', querySelector() { return null; }, querySelectorAll() { return []; }, appendChild() {} },
    relationData: { nodes: [], edges: [] },
    init() {},
    freshState() { return freshState(); },
    toast() {},
    logChoice() {},
    logNarration() {},
    updateStatus() {},
    saveGame() {},
    scroll() {},
    openPanel() {},
    showPresentBtn() {},
    applyWeatherClass() {},
    ambientLine() {},
    openDeduction() {},
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
    registerRelation(person, labels = [], connectsTo = []) {
      if (!this.relationData.nodes.find(n => n.id === person)) {
        this.relationData.nodes.push({ id: person, labels, discovered: false });
      }
      for (const target of connectsTo || []) {
        if (!this.relationData.edges.find(e => (e.from === person && e.to === target) || (e.from === target && e.to === person))) {
          this.relationData.edges.push({ from: person, to: target, revealed: false });
        }
      }
    },
    discoverRelation(name) {
      this.addContact(name);
      const node = this.relationData.nodes.find(n => n.id === name);
      if (node) node.discovered = true;
      for (const edge of this.relationData.edges) {
        const from = this.relationData.nodes.find(n => n.id === edge.from);
        const to = this.relationData.nodes.find(n => n.id === edge.to);
        if (from?.discovered && to?.discovered) edge.revealed = true;
      }
    },
    setFlag(k, v) { this.state.flags[k] = v; },
    getFlag(k) { return this.state.flags[k]; },
    canDeduce() { return true; },
    caseStrength() { return { name: '自动剧情测试', desc: 'story-harness 案情强度占位。' }; },
  };
  return E;
}

export function createDocumentStub(domReadyHandlers, locationStub = { href: 'http://localhost/', search: '', hash: '', pathname: '/' }) {
  return {
    location: locationStub,
    addEventListener(event, handler) {
      if (event === 'DOMContentLoaded') domReadyHandlers.push(handler);
    },
    body: { classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, appendChild() {} },
    head: { appendChild() {} },
    getElementById() {
      return {
        style: {},
        innerHTML: '',
        textContent: '',
        appendChild() {},
        scrollIntoView() {},
        addEventListener() {},
      };
    },
    createElement() {
      return { className: '', textContent: '', title: '', onclick: null, style: {}, appendChild() {} };
    },
    write() {},
  };
}

export function loadStoryRuntime(options = {}) {
  const repoRoot = options.repoRoot || process.cwd();
  const domReadyHandlers = [];
  const E = options.E || createEngineStub(options.initialState || {});
  const locationStub = options.location || { href: 'http://localhost/', search: '', hash: '', pathname: '/' };
  const documentStub = createDocumentStub(domReadyHandlers, locationStub);
  const windowStub = { location: locationStub };
  const URLCtor = globalThis.URL;
  const URLSearchParamsCtor = globalThis.URLSearchParams;

  const context = vm.createContext({
    console,
    E,
    document: documentStub,
    window: windowStub,
    location: locationStub,
    URL: URLCtor,
    URLSearchParams: URLSearchParamsCtor,
    localStorage: { getItem() { return null; }, setItem() {} },
    setTimeout(fn) { if (typeof fn === 'function') fn(); },
    clearTimeout() {},
  });
  context.globalThis = context;
  context.window = context;
  context.location = locationStub;
  context.URL = URLCtor;
  context.URLSearchParams = URLSearchParamsCtor;
  vm.runInContext('globalThis.URL = URL; globalThis.URLSearchParams = URLSearchParams; window.URL = URL; window.URLSearchParams = URLSearchParams;', context);

  function read(rel) {
    return fs.readFileSync(path.join(repoRoot, rel), 'utf8');
  }

  function runScript(rel, suffix = '') {
    const code = read(rel) + suffix;
    vm.runInContext(code, context, { filename: rel });
  }

  runScript('src/story.js', '\nglobalThis.nodes = nodes;');
  runScript('src/main.js');
  runStoryModuleScripts(runScript, repoRoot);
  for (const handler of domReadyHandlers) handler();

  const nodes = context.nodes;
  if (!nodes || typeof nodes !== 'object') throw new Error('无法加载 nodes。');

  return {
    repoRoot,
    context,
    E,
    nodes,
    read,
    runScript,
    resetState(overrides = {}) {
      E.state = freshState(overrides);
    },
    renderNode(id) {
      const node = nodes[id];
      if (!node) throw new Error(`场景丢失：${id}`);
      E.state.currentScene = id;
      E.state.sceneLog.push(id);
      E.state.visitedNodes[id] = (E.state.visitedNodes[id] || 0) + 1;
      if (typeof node.effect === 'function') node.effect(E.state);
      if (node.time) E.setTime(node.time.d, node.time.h, node.time.m);
      if (node.cost && E.state.visitedNodes[id] <= 1) {
        E.spendTime(node.cost.h || 0, node.cost.m || 0, node.cost.reason || '调查耗时');
      }
      if (typeof node.text === 'function') node.text(E.state);
      return node;
    },
    choicesOf(id = E.state.currentScene) {
      const node = nodes[id];
      if (!node) throw new Error(`场景丢失：${id}`);
      const choices = typeof node.choices === 'function' ? node.choices(E.state) : node.choices;
      return Array.isArray(choices) ? choices : [];
    },
    runChoice(choice, expectedText = '选项') {
      if (!choice) throw new Error(`找不到${expectedText}`);
      if (choice.when && !choice.when(E.state)) throw new Error(`${expectedText} 条件未满足`);
      if (typeof choice.effect === 'function') choice.effect(E.state);
      const next = typeof choice.goto === 'function' ? choice.goto(E.state) : choice.goto;
      this.renderNode(next);
      return next;
    },
    goByTarget(target) {
      const current = E.state.currentScene;
      const choice = this.choicesOf(current).find(c => c.goto === target || (typeof c.goto === 'function' && c.goto(E.state) === target));
      return this.runChoice(choice, `通往 ${target} 的选项`);
    },
    goByText(textFragment) {
      const current = E.state.currentScene;
      const choice = this.choicesOf(current).find(c => c.text && c.text.includes(textFragment));
      return this.runChoice(choice, `包含「${textFragment}」的选项`);
    },
    present(sceneId, itemName, desc = '') {
      const scene = this.renderNode(sceneId);
      if (typeof scene.onPresent !== 'function') throw new Error(`${sceneId} 没有 onPresent`);
      return scene.onPresent({ name: itemName, desc }, E.state);
    },
    assertFlag(flag, value = true) {
      if (E.state.flags[flag] !== value) throw new Error(`flag ${flag} 预期 ${value}，实际 ${E.state.flags[flag]}`);
    },
    assertClue(name) {
      if (!E.state.clues.some(c => c.name === name)) throw new Error(`缺少线索：${name}`);
    },
    assertItem(name) {
      if (!E.state.items.some(i => i.name === name)) throw new Error(`缺少物品：${name}`);
    },
    assertSceneContains(id) {
      if (!E.state.sceneLog.includes(id)) throw new Error(`路线未经过场景：${id}`);
    },
    assertNode(id) {
      if (!nodes[id]) throw new Error(`缺少节点：${id}`);
    },
  };
}
