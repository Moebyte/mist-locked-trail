#!/usr/bin/env node
/*
 * 雾锁迷踪 · 无头剧情巡检器
 *
 * 用法：
 *   node tools/game-flow-runner.mjs
 *   node tools/game-flow-runner.mjs --strategy=golden --max-depth=120
 *   node tools/game-flow-runner.mjs --strategy=bfs --max-depth=80 --max-states=2000
 *
 * 设计目标：
 * - 不启动浏览器，不依赖 Playwright，不需要外部 npm 包。
 * - 直接加载 src/engine.js、src/story.js、src/main.js 和 story-modules.js 中登记的模块。
 * - 模拟按钮、推理题、跳转、结局、场景丢失。
 * - 输出 JSON + Markdown，方便人和 AI 继续分析。
 */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const OUT_DIR = path.join(ROOT, 'tmp');

const args = parseArgs(process.argv.slice(2));
const STRATEGY = args.strategy || 'golden';
const MAX_DEPTH = Number(args['max-depth'] || (STRATEGY === 'bfs' ? 80 : 160));
const MAX_STATES = Number(args['max-states'] || 3000);

const DEDUCTION_ANSWERS = {
  deduce_chen: 1,
  deduce_lu_zhao: 2,
  deduce_fusheng: 1,
};

const GOLDEN_KEYWORDS = [
  '先问几个问题',
  '委托我接了',
  '圣约翰大学',
  '问舍监',
  '门房',
  '论文草稿',
  '去下一个地方',
  '巡捕房',
  '卷宗',
  '王巡官',
  '薛华立路',
  '周围观察',
  '看门老头',
  '203',
  '搜查房间',
  '光华小学',
  '陈老师',
  '苏晚亭的关系',
  '学校还有什么异常',
  '办公室',
  '信',
  '吴校长',
  '恐吓信',
  '三人合影',
  '日记残页',
  '合到一起',
  '推理陈明远之死',
  '当铺',
  '翡翠镯',
  '周怀安',
  '黑衣男人与陆小姐',
  '老孙',
  '福生仓',
  '立刻',
  '后门观察',
  '继续观察',
  '潜入',
  '教具箱',
  '暗门',
  '身份',
  '离开暗室',
  '傅启元',
  '送她们离开',
  '福生仓与公董局',
  '自然收束',
];

function parseArgs(argv) {
  const out = {};
  for (const arg of argv) {
    const m = arg.match(/^--([^=]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
    else if (arg.startsWith('--')) out[arg.slice(2)] = true;
  }
  return out;
}

function makeElement(id = '') {
  const el = {
    id,
    style: {},
    className: '',
    textContent: '',
    innerHTML: '',
    children: [],
    attributes: {},
    classList: {
      add() {},
      remove() {},
      toggle() {},
      contains() { return false; },
    },
    appendChild(child) { this.children.push(child); return child; },
    remove() {},
    setAttribute(k, v) { this.attributes[k] = v; },
    getAttribute(k) { return this.attributes[k]; },
    querySelector(selector) {
      if (!this.__qs) this.__qs = new Map();
      if (!this.__qs.has(selector)) this.__qs.set(selector, makeElement(selector));
      return this.__qs.get(selector);
    },
    scrollIntoView() {},
    addEventListener() {},
  };
  return el;
}

function makeRuntime() {
  const elements = new Map();
  const domReadyCallbacks = [];
  const writtenScripts = [];
  const context = {
    console,
    window: {},
    localStorage: {
      store: new Map(),
      getItem(k) { return this.store.has(k) ? this.store.get(k) : null; },
      setItem(k, v) { this.store.set(k, String(v)); },
      removeItem(k) { this.store.delete(k); },
    },
    document: {
      body: makeElement('body'),
      getElementById(id) {
        if (!elements.has(id)) elements.set(id, makeElement(id));
        return elements.get(id);
      },
      createElement(tag) { return makeElement(tag); },
      addEventListener(event, cb) {
        if (event === 'DOMContentLoaded') domReadyCallbacks.push(cb);
      },
      write(html) {
        const match = String(html).match(/src=["']([^"']+)/);
        if (match) writtenScripts.push(match[1]);
      },
    },
    setTimeout(cb) {
      // 自动跳转在巡检器里只记录为风险，不异步执行，避免 BFS 不可控。
      return 0;
    },
    clearTimeout() {},
    confirm() { return true; },
  };
  context.window = context;
  vm.createContext(context);

  function runFile(rel) {
    const abs = path.join(ROOT, rel);
    const code = fs.readFileSync(abs, 'utf8');
    vm.runInContext(code, context, { filename: rel });
  }

  runFile('src/engine.js');
  runFile('src/story.js');
  runFile('src/main.js');

  const modules = readStoryModules();
  for (const src of modules) runFile(src);

  for (const cb of domReadyCallbacks) {
    try { cb(); } catch (err) { context.__bootError = err; }
  }

  if (!context.E || !context.nodes) throw new Error('启动失败：E 或 nodes 未定义');
  return context;
}

function readStoryModules() {
  const content = fs.readFileSync(path.join(SRC, 'story-modules.js'), 'utf8');
  const matches = [...content.matchAll(/'([^']+story-modules\/[^']+\.js)'/g)].map(m => m[1]);
  return matches;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function snapshot(ctx) {
  return {
    state: clone(ctx.E.state),
    deductions: clone(ctx.E.deductions || []),
    relationData: clone(ctx.E.relationData || { nodes: [], edges: [] }),
  };
}

function restore(ctx, snap) {
  ctx.E.state = clone(snap.state);
  ctx.E.deductions = clone(snap.deductions || []);
  ctx.E.relationData = clone(snap.relationData || { nodes: [], edges: [] });
}

function choiceText(c) {
  return c?.text || c?.fogText || '';
}

function resolveChoices(ctx, node) {
  if (!node) return [];
  const raw = typeof node.choices === 'function' ? node.choices(ctx.E.state) : (node.choices || []);
  return Array.isArray(raw) ? raw : [];
}

function isLocked(ctx, c) {
  try { return !!(c.when && !c.when(ctx.E.state)); }
  catch { return true; }
}

function inferDeductionId(text) {
  if (text.includes('陈明远')) return 'deduce_chen';
  if (text.includes('黑衣男人') || text.includes('陆小姐')) return 'deduce_lu_zhao';
  if (text.includes('福生仓') || text.includes('公董局')) return 'deduce_fusheng';
  return null;
}

function clickChoice(ctx, sceneId, choice) {
  const beforeScene = ctx.E.state.currentScene;
  const text = choiceText(choice);
  const result = { ok: true, text, from: sceneId, to: null, ending: null, errors: [] };

  if (isLocked(ctx, choice)) {
    result.ok = false;
    result.errors.push(`锁定选项：${choice.fogHint || text}`);
    return result;
  }

  try {
    if (choice.effect) choice.effect(ctx.E.state);

    const deduceId = inferDeductionId(text);
    if (deduceId && !choice.goto) {
      const answer = DEDUCTION_ANSWERS[deduceId];
      if (typeof answer === 'number' && typeof ctx.E.submitDeduction === 'function') {
        ctx.E.submitDeduction(deduceId, answer);
      }
    }

    if (choice.goto) {
      const target = typeof choice.goto === 'function' ? choice.goto(ctx.E.state) : choice.goto;
      if (!ctx.nodes[target]) {
        result.ok = false;
        result.errors.push(`缺失目标节点：${target}`);
        result.to = target;
        return result;
      }
      ctx.E.go(target);
    }

    if (choice.end) {
      ctx.E.endGame(choice.end);
      result.ending = choice.end;
    }

    result.to = ctx.E.state.currentScene || beforeScene;
    return result;
  } catch (err) {
    result.ok = false;
    result.errors.push(err && err.stack ? err.stack : String(err));
    return result;
  }
}

function enterScene(ctx, sceneId) {
  const result = { ok: true, sceneId, errors: [], choices: [] };
  if (!ctx.nodes[sceneId]) {
    result.ok = false;
    result.errors.push(`场景丢失：${sceneId}`);
    return result;
  }
  try {
    ctx.E.go(sceneId);
    const node = ctx.nodes[sceneId];
    result.choices = resolveChoices(ctx, node).map(c => ({ text: choiceText(c), locked: isLocked(ctx, c), goto: typeof c.goto === 'string' ? c.goto : typeof c.goto }));
    if (!result.choices.length && node.type !== 'end' && !node.auto) {
      result.errors.push('非结局节点没有可选项');
      result.ok = false;
    }
  } catch (err) {
    result.ok = false;
    result.errors.push(err && err.stack ? err.stack : String(err));
  }
  return result;
}

function chooseGolden(choices) {
  const available = choices.filter(c => !c.__locked);
  for (const kw of GOLDEN_KEYWORDS) {
    const found = available.find(c => choiceText(c).includes(kw));
    if (found) return found;
  }
  return available[0] || null;
}

function runGolden() {
  const ctx = makeRuntime();
  const report = baseReport(ctx, 'golden');
  ctx.E.start();

  let sceneId = ctx.E.state.currentScene || 'ch1_open';
  const visited = [];
  for (let depth = 0; depth < MAX_DEPTH; depth++) {
    const node = ctx.nodes[sceneId];
    if (!node) {
      report.errors.push({ type: 'missing_scene', sceneId, path: visited.map(v => v.scene) });
      break;
    }
    visited.push({ scene: sceneId, title: node.title || '', flags: clone(ctx.E.state.flags || {}) });
    if (node.type === 'end') break;

    const choices = resolveChoices(ctx, node).map(c => Object.assign(c, { __locked: isLocked(ctx, c) }));
    if (!choices.length) {
      report.errors.push({ type: 'dead_end', sceneId, title: node.title || '' });
      break;
    }
    const choice = chooseGolden(choices);
    if (!choice) {
      report.errors.push({ type: 'all_choices_locked', sceneId, choices: choices.map(choiceText) });
      break;
    }
    const transition = clickChoice(ctx, sceneId, choice);
    report.transitions.push(transition);
    if (!transition.ok) {
      report.errors.push({ type: 'transition_error', sceneId, transition });
      break;
    }
    sceneId = ctx.E.state.currentScene || transition.to;
  }

  report.finalScene = ctx.E.state.currentScene;
  report.finalFlags = clone(ctx.E.state.flags || {});
  report.path = visited;
  report.summary = summarize(report);
  return report;
}

function runBfs() {
  const ctx = makeRuntime();
  const report = baseReport(ctx, 'bfs');
  ctx.E.start();
  const rootSnap = snapshot(ctx);
  const queue = [{ scene: ctx.E.state.currentScene || 'ch1_open', snap: rootSnap, path: [] }];
  const seen = new Set();

  while (queue.length && report.visitedStates < MAX_STATES) {
    const item = queue.shift();
    restore(ctx, item.snap);
    const key = stateKey(ctx, item.scene);
    if (seen.has(key)) continue;
    seen.add(key);
    report.visitedStates++;

    const entered = enterScene(ctx, item.scene);
    if (!entered.ok) {
      report.errors.push({ type: 'enter_error', sceneId: item.scene, path: item.path, errors: entered.errors });
      continue;
    }

    const node = ctx.nodes[item.scene];
    report.reachedScenes.add(item.scene);
    if (node.type === 'end') {
      report.reachedEndings.add(item.scene);
      continue;
    }
    if (item.path.length >= MAX_DEPTH) continue;

    const choices = resolveChoices(ctx, node);
    if (!choices.length && !node.auto) {
      report.errors.push({ type: 'dead_end', sceneId: item.scene, path: item.path });
      continue;
    }

    for (const choice of choices) {
      if (isLocked(ctx, choice)) continue;
      const before = snapshot(ctx);
      const transition = clickChoice(ctx, item.scene, choice);
      report.transitions.push(transition);
      if (!transition.ok) {
        report.errors.push({ type: 'transition_error', sceneId: item.scene, path: item.path, transition });
        restore(ctx, before);
        continue;
      }
      const nextScene = ctx.E.state.currentScene || transition.to;
      queue.push({ scene: nextScene, snap: snapshot(ctx), path: item.path.concat(`${item.scene} -> ${choiceText(choice)} -> ${nextScene}`) });
      restore(ctx, before);
    }
  }

  report.reachedScenes = [...report.reachedScenes].sort();
  report.reachedEndings = [...report.reachedEndings].sort();
  report.summary = summarize(report);
  return report;
}

function stateKey(ctx, scene) {
  const flags = ctx.E.state.flags || {};
  const importantFlags = Object.keys(flags).sort().filter(k => flags[k]).join(',');
  const clues = (ctx.E.state.clues || []).map(c => c.name).sort().join(',');
  const items = (ctx.E.state.items || []).map(i => i.name).sort().join(',');
  return `${scene}|f:${importantFlags}|c:${clues}|i:${items}`;
}

function baseReport(ctx, strategy) {
  return {
    strategy,
    bootError: ctx.__bootError ? String(ctx.__bootError.stack || ctx.__bootError) : null,
    moduleCount: Array.isArray(ctx.window.MLT_STORY_MODULES) ? ctx.window.MLT_STORY_MODULES.length : readStoryModules().length,
    nodeCount: Object.keys(ctx.nodes || {}).length,
    deductionIds: (ctx.E.deductions || []).map(d => d.id),
    transitions: [],
    errors: [],
    warnings: staticWarnings(ctx),
    visitedStates: 0,
    reachedScenes: new Set(),
    reachedEndings: new Set(),
  };
}

function staticWarnings(ctx) {
  const warnings = [];
  for (const [id, node] of Object.entries(ctx.nodes || {})) {
    const choices = typeof node.choices === 'function' ? [] : (Array.isArray(node.choices) ? node.choices : []);
    for (const c of choices) {
      if (typeof c.goto === 'string' && !ctx.nodes[c.goto]) {
        warnings.push({ type: 'static_missing_goto', from: id, to: c.goto, text: choiceText(c) });
      }
    }
  }
  for (const d of ctx.E.deductions || []) {
    if (d.successNode && !ctx.nodes[d.successNode]) warnings.push({ type: 'missing_deduction_success', id: d.id, to: d.successNode });
    if (d.failNode && !ctx.nodes[d.failNode]) warnings.push({ type: 'missing_deduction_fail', id: d.id, to: d.failNode });
  }
  return warnings;
}

function summarize(report) {
  return {
    ok: !report.bootError && report.errors.length === 0,
    errorCount: report.errors.length,
    warningCount: report.warnings.length,
    transitionCount: report.transitions.length,
    finalScene: report.finalScene || null,
    reachedEndingCount: Array.isArray(report.reachedEndings) ? report.reachedEndings.length : report.reachedEndings?.size || 0,
  };
}

function writeReports(report) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const jsonPath = path.join(OUT_DIR, `flow-report-${report.strategy}.json`);
  const mdPath = path.join(OUT_DIR, `flow-report-${report.strategy}.md`);
  const serializable = {
    ...report,
    reachedScenes: report.reachedScenes instanceof Set ? [...report.reachedScenes] : report.reachedScenes,
    reachedEndings: report.reachedEndings instanceof Set ? [...report.reachedEndings] : report.reachedEndings,
  };
  fs.writeFileSync(jsonPath, JSON.stringify(serializable, null, 2), 'utf8');
  fs.writeFileSync(mdPath, toMarkdown(serializable), 'utf8');
  console.log(JSON.stringify(serializable.summary, null, 2));
  console.log(`\n报告已生成：\n- ${path.relative(ROOT, jsonPath)}\n- ${path.relative(ROOT, mdPath)}`);
}

function toMarkdown(report) {
  const lines = [];
  lines.push(`# 游戏流程巡检报告（${report.strategy}）`);
  lines.push('');
  lines.push(`- 启动错误：${report.bootError || '无'}`);
  lines.push(`- 节点数：${report.nodeCount}`);
  lines.push(`- 模块数：${report.moduleCount}`);
  lines.push(`- 推理题：${(report.deductionIds || []).join('、') || '无'}`);
  lines.push(`- 错误数：${report.errors.length}`);
  lines.push(`- 警告数：${report.warnings.length}`);
  lines.push('');
  if (report.errors.length) {
    lines.push('## 错误');
    for (const e of report.errors.slice(0, 100)) lines.push(`- ${e.type}: ${JSON.stringify(e)}`);
    lines.push('');
  }
  if (report.warnings.length) {
    lines.push('## 警告');
    for (const w of report.warnings.slice(0, 100)) lines.push(`- ${w.type}: ${JSON.stringify(w)}`);
    lines.push('');
  }
  if (report.path) {
    lines.push('## Golden Path');
    for (const step of report.path) lines.push(`- ${step.scene}：${step.title}`);
    lines.push('');
  }
  if (report.reachedEndings?.length) {
    lines.push('## 可达结局');
    for (const end of report.reachedEndings) lines.push(`- ${end}`);
  }
  return lines.join('\n');
}

const report = STRATEGY === 'bfs' ? runBfs() : runGolden();
writeReports(report);
if (report.bootError || report.errors.length) process.exitCode = 1;
