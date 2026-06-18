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

function createElementStub(extra = {}) {
  return {
    style: {},
    innerHTML: '',
    textContent: '',
    className: '',
    title: '',
    onclick: null,
    appendChild() {},
    scrollIntoView() {},
    addEventListener() {},
    setAttribute() {},
    removeAttribute() {},
    querySelector() { return createElementStub(); },
    querySelectorAll() { return []; },
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    ...extra,
  };
}

function createDeductionModalStub() {
  const optionContainer = createElementStub({ innerHTML: '' });
  const question = createElementStub({ textContent: '' });
  return createElementStub({
    style: { display: 'none' },
    querySelector(selector) {
      if (selector === '.deduc-question') return question;
      if (selector === '.deduc-options') return optionContainer;
      return createElementStub();
    },
  });
}

export function createEngineStub(initialState = {}) {
  const deducEl = createDeductionModalStub();
  const E = {
    state: freshState(initialState),
    saveKey: 'story-harness',
    logEl: { innerHTML: '', style: {} },
    sceneEl: { style: {} },
    titleEl: {},
    textEl: {},
    choicesEl: { innerHTML: '', querySelector() { return null; }, querySelectorAll() { return []; }, appendChild() {} },
    toastEl: createElementStub(),
    deducEl,
    graphEl: createElementStub({ querySelector() { return createElementStub({ innerHTML: '' }); } }),
    relationData: { nodes: [], edges: [] },
    deductions: [],
    init() {},
    freshState() { return freshState(); },
    toast() {},
    go(id) { this.lastGoto = id; },
    logChoice() {},
    logNarration() {},
    updateStatus() {},
    saveGame() {},
    scroll() {},
    openPanel() {},
    showPresentBtn() {},
    applyWeatherClass() {},
    ambientLine() {},
    openDeduction(id) {
      this.lastOpenedDeduction = id;
      this.deducEl.style.display = 'flex';
      return true;
    },
    closeDeduction() { this.deducEl.style.display = 'none'; },
    submitDeduction(id, chosenIdx) {
      const d = Array.isArray(this.deductions) ? this.deductions.find(x => x.id === id) : null;
      if (!d) return false;
      if (chosenIdx === d.correctIdx) {
        d.solved = true;
        if (this.deducEl?.style) this.deducEl.style.display = 'none';
        this.toast('✅ 推理正确！拼图又完整了一块。');
        if (typeof this.go === 'function') this.go(d.successNode);
        return true;
      }
      this.setFlag(`deduction_${id}_wrong_once`, true);
      if (this.deducEl?.style) this.deducEl.style.display = 'flex';
      this.toast('再想想。这个答案还压不住现有证据。');
      try {
        const container = this.deducEl?.querySelector?.('.deduc-options');
        const old = container?.querySelector?.('.deduc-feedback');
        if (!old && container?.appendChild) {
          container.appendChild(createElementStub({ className: 'deduc-feedback', textContent: '再想想。这个答案还压不住现有证据。' }));
        }
      } catch {}
      return false;
    },
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
    registerDeduction(id, question, options, correctIdx, successNode, failNode, requiredClues) {
      if (!Array.isArray(this.deductions)) this.deductions = [];
      this.deductions.push({ id, question, options, correctIdx, successNode, failNode, requiredClues, solved: false });
    },
    registerAll() {
      this.registerDeduction('deduce_chen', '陈明远的真正死因最有可能是？', [
        'A. 因愧对学生而自杀',
        'B. 被陆小姐灭口——他发现了她的真实身份',
        'C. 被吴校长灭口——他发现学校有非法交易',
        'D. 因情感纠葛被苏晚亭牵连'
      ], 1, 'deduc_success', 'deduc_fail', ['陈明远坠楼案', '恐吓信', '陆小姐的笔记', '陈明远的信']);

      this.registerDeduction('deduce_lu_zhao', '陆小姐与黑衣男人的真实关系是？', [
        'A. 情人与合谋——他们一起做敲诈生意',
        'B. 黑衣男人是陆小姐的上线——陆小姐受他指挥',
        'C. 黑衣男在追查陆小姐——沈玉兰雇他调查',
        'D. 没有关系——黑衣男只是恰好去过薛华立路'
      ], 2, 'deduc_lu_zhao_ok', 'deduc_lu_zhao_fail', ['跟踪黑衣男人', '神秘女子', '沈玉兰的妹妹', '翡翠镯']);

      this.registerDeduction('deduce_fusheng', '福生仓与公董局的关联意味着什么？', [
        'A. 一场普通的商业纠纷',
        'B. 法租界高层有人利用学校掩护走私，陈老师和沈玉芳发现了真相',
        'C. 吴校长私自挪用学校资金',
        'D. 公董局要拆除光华小学建仓库'
      ], 1, 'deduc_fusheng_ok', 'deduc_fusheng_fail', ['王巡官遗留纸条', '陈明远的信', '恐吓信', '公董局公文纸', '教具箱走私']);
    },
    setFlag(k, v) { this.state.flags[k] = v; },
    getFlag(k) { return this.state.flags[k]; },
    canDeduce(id) {
      const d = Array.isArray(this.deductions) ? this.deductions.find(x => x.id === id) : null;
      if (!d && typeof this.ensureDeductionRegistered === 'function') return !!this.ensureDeductionRegistered(id);
      if (!d) return true;
      return !d.solved && (d.requiredClues || []).every(c => this.hasClue(c));
    },
    caseStrength() { return { name: '自动剧情测试', desc: 'story-harness 案情强度占位。' }; },
  };
  return E;
}

export function createDocumentStub(domReadyHandlers) {
  const elements = new Map();
  function getOrCreate(id) {
    if (!elements.has(id)) {
      elements.set(id, createElementStub({ id }));
    }
    return elements.get(id);
  }

  return {
    addEventListener(event, handler) {
      if (event === 'DOMContentLoaded') domReadyHandlers.push(handler);
    },
    body: createElementStub(),
    head: { appendChild() {} },
    getElementById(id) {
      return getOrCreate(id);
    },
    createElement() {
      return createElementStub();
    },
    write() {},
  };
}

export function loadStoryRuntime(options = {}) {
  const repoRoot = options.repoRoot || process.cwd();
  const domReadyHandlers = [];
  const E = options.E || createEngineStub(options.initialState || {});
  const documentStub = createDocumentStub(domReadyHandlers);

  const context = vm.createContext({
    console,
    E,
    document: documentStub,
    URLSearchParams,
    window: { location: { search: '', hash: '' } },
    localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
    setTimeout(fn) { if (typeof fn === 'function') fn(); },
    clearTimeout() {},
  });
  context.globalThis = context;

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
      if (E.deducEl?.style) E.deducEl.style.display = 'none';
      E.lastOpenedDeduction = null;
      E.lastGoto = null;
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
