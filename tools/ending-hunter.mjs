#!/usr/bin/env node
/**
 * 雾锁迷踪 · 结局猎手
 *
 * 对每个结局，定义目标 flags 和约束条件，
 * 逐选择路线模拟游戏过程，抵达终点后报告结果。
 *
 * 用法：
 *   node tools/ending-hunter.mjs                           # 全部结局
 *   node tools/ending-hunter.mjs --ending=end_true_hidden   # 指定结局
 *   node tools/ending-hunter.mjs --list                     # 列出结局定义
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
const MAX_DEPTH = 300;

const args = {};
for (const a of process.argv.slice(2)) {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/);
  if (m) args[m[1]] = m[2] || true;
}

// ===== 结局定义 =====
const ENDING_DEFS = {
  end_refuse: {
    title: '雨声不停',
    description: '序幕拒接委托',
    required_flags: {},
    preferred_keywords: ['这个案子我不接', '听完了，但这个案子我不接', '问清楚了，但这个案子我不接'],
    terminal_scene: 'end_refuse',
  },
  end_archive: {
    title: '无声归档',
    description: '证据不足直接归档',
    required_flags: {},
    preferred_keywords: ['把案卷封起', '封起', '归档', '证据不足'],
    terminal_scene: 'end_archive',
    skip_checks: ['premature_conclusion_end_archive'],  // 跳过"过早结案"保护
  },
  end_boss_lu: {
    title: '面具之下',
    description: '指认陆小姐为真凶',
    required_flags: {},
    preferred_keywords: ['指认其中一个', '陆小姐', '指认', '真凶'],
    terminal_scene: 'end_boss_lu',
  },
  end_boss_zhao: {
    title: '提线木偶',
    description: '指认黑衣男人为真凶',
    required_flags: {},
    preferred_keywords: ['指认其中一个', '黑衣男人', '赵某', '指认', '真凶'],
    terminal_scene: 'end_boss_zhao',
  },
  end_boss_wu: {
    title: '师者无声',
    description: '指认吴校长为真凶',
    required_flags: {},
    preferred_keywords: ['指认其中一个', '吴校长', '指认', '真凶'],
    terminal_scene: 'end_boss_wu',
  },
  end_too_late: {
    title: '迟到一步',
    description: '超时未救到人',
    required_flags_end: { missed_deadline: true },
    preferred_keywords: ['自然收束', '封起', '证据不足'],
    terminal_scene: 'end_too_late',
  },
  end_conspiracy: {
    title: '迷雾未尽',
    description: '推理三完成但无人获救',
    required_flags_end: { deduced_fusheng: true, rescued_yufang: false, rescued_su: false },
    key_steps: ['苏家', '大学', '巡捕房', '薛华立路', '203室', '光华小学', '三证物', '推理一', '当铺', '周怀安', '推理二', '老孙支援', '福生仓', '推理三', '自然收束'],
    preferred_keywords: ['自然收束', '陈明远之死', '黑衣男人与陆小姐', '福生仓与公董局', '暂时不找他', '暂时不打扰'],
    terminal_scene: 'end_conspiracy',
  },
  end_rescue: {
    title: '黎明灯火',
    description: '救人成功但未打穿利益链',
    required_flags_end: { rescued_yufang: true, rescued_su: false, deduced_fusheng: false },
    preferred_keywords: ['自然收束', '老孙', '支援', '福生仓', '救人', '带她离开'],
    terminal_scene: 'end_rescue',
  },
  end_conspiracy_detail: {
    title: '雨夜灯火（隐藏）',
    description: '单救+推理三+学校三证物',
    required_flags_end: { rescued_yufang: true, deduced_fusheng: true, school_wu_three_proofs: true },
    preferred_keywords: ['自然收束', '推理', '福生仓与公董局', '老孙'],
    terminal_scene: 'end_conspiracy_detail',
  },
  end_zhou_chen_letter: {
    title: '吾爱晚亭',
    description: '向周怀安出示两封信',
    required_flags_end: { presented_chen_letter_to_zhou: true, presented_su_last_letter_to_zhou: true },
    preferred_keywords: ['陈明远的信', '未寄出的信', '遗书', '继续拿出'],
    terminal_scene: 'end_zhou_chen_letter',
  },
  end_true_hidden: {
    title: '破晓之前（真隐藏）',
    description: '双救+三段推理+三证物+证人保护',
    required_flags_end: { rescued_yufang: true, rescued_su: true, deduced_fusheng: true, school_wu_three_proofs: true, v07_witnesses_protected: true },
    preferred_keywords: ['自然收束', '推理', '福生仓与公董局', '老孙', '苏家', '信物'],
    terminal_scene: 'end_true_hidden',
  },
  end_dock_silenced: {
    title: '雾中枪声',
    description: '码头硬对峙被灭口',
    required_flags_end: { dock_solo_hard_confront: true },
    preferred_keywords: ['硬对峙', '站到车灯前', '货运单和清场指令', '立刻'],
    terminal_scene: 'end_dock_silenced',
  },
};

// ===== 工具函数 =====
function makeElement(id = '') {
  const el = { id, style: {}, className: '', textContent: '', innerHTML: '',
    children: [], attributes: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    appendChild(c) { this.children.push(c); return c; }, remove() {},
    setAttribute(k, v) { this.attributes[k] = v; },
    getAttribute(k) { return this.attributes[k]; },
    querySelector(s) {
      if (!s) return null;
      const match = (el) => {
        if (s.startsWith('.')) return (el.className||'').includes(s.slice(1))||(el.attributes?.class||'').includes(s.slice(1));
        if (s.startsWith('#')) return el.id === s.slice(1);
        return el.id === s || (el.tagName && el.tagName === s);
      };
      const search = (arr) => { for (const c of arr||[]) { if (match(c)) return c; const f = search(c.children); if (f) return f; } return null; };
      const f = search(this.children); if (f) return f;
      if (!this.__qs) this.__qs = new Map();
      if (!this.__qs.has(s)) this.__qs.set(s, makeElement(s));
      return this.__qs.get(s);
    },
    querySelectorAll(s) { if (!s) return []; const r = []; const m = (e) => { if (s.startsWith('.')) return (e.className||'').includes(s.slice(1))||(e.attributes?.class||'').includes(s.slice(1)); return e.id === s; }; const sr = (a) => { for (const c of a||[]) { if (m(c)) r.push(c); sr(c.children); } }; sr(this.children); r.forEach = Array.prototype.forEach; return r; },
    scrollIntoView() {}, addEventListener() {},
  };
  return el;
}

function makeRuntime() {
  const elements = new Map();
  const domReadyCallbacks = [];
  const context = { console, window: {},
    localStorage: { store: new Map(), getItem(k) { return this.store.get(k)||null; }, setItem(k,v) { this.store.set(k,String(v)); }, removeItem(k) { this.store.delete(k); } },
    document: { body: makeElement('body'), head: { appendChild() {} },
      getElementById(id) { if (!elements.has(id)) elements.set(id, makeElement(id)); return elements.get(id); },
      createElement(tag) { return makeElement(tag); },
      addEventListener(event, cb) { if (event === 'DOMContentLoaded') domReadyCallbacks.push(cb); },
      write(html) {},
    },
    setTimeout() { return 0; }, clearTimeout() {}, confirm() { return true; },
  };
  context.window = context;
  vm.createContext(context);

  function runFile(rel) { vm.runInContext(fs.readFileSync(path.join(ROOT,rel),'utf8'), context, { filename: rel }); }
  function runFileWithGlobal(name, rel) {
    const code = fs.readFileSync(path.join(ROOT,rel),'utf8');
    vm.runInContext(code + '\nglobalThis.' + name + ' = ' + name + ';', context, { filename: rel });
  }

  runFileWithGlobal('E', 'src/engine.js');
  runFileWithGlobal('nodes', 'src/story.js');
  runFile('src/main.js');

  const modules = (fs.readFileSync(path.join(SRC,'story-modules.js'),'utf8').match(/'([^']+story-modules\/[^']+\.js)'/g)||[]).map(m=>m.slice(1,-1));
  for (const m of modules) runFile(m);
  for (const cb of domReadyCallbacks) { try { cb(); } catch {} }

  return { context, E: context.E, nodes: context.nodes };
}

function clone(v) { return JSON.parse(JSON.stringify(v)); }

function targetProgress(E, def) {
  const flags = E.state?.flags || {};
  const clues = E.state?.clues || [];
  const items = E.state?.items || [];
  const required = def.required_flags_end || {};
  const total = Object.keys(required).length;
  if (total === 0) return 1; // no target → always 100%
  let met = 0;
  for (const [k, v] of Object.entries(required)) {
    if (flags[k] === v) met++;
    // Also check inverse: if required is false, flag should be falsy
    if (v === false && !flags[k]) met++;
  }
  // Normalize: if the required value is false, we counted it twice
  // So divide by total
  return met / total;
}

function choiceText(c) { return c?.text || c?.fogText || ''; }

function isLocked(ctx, c) {
  try { return !!(c.when && !c.when(ctx.E.state)); } catch { return true; }
}

function huntEnding(endingId) {
  const def = ENDING_DEFS[endingId];
  if (!def) return { endingId, ok: false, error: `未知结局: ${endingId}` };

  const { context, E, nodes } = makeRuntime();
  E.start();

  let sceneId = E.state.currentScene || 'ch1_open';
  let reached = false;
  let finalFlags = {};
  const path = [];
  const keywords = def.preferred_keywords || [];
  const terminal = def.terminal_scene;

  for (let depth = 0; depth < MAX_DEPTH; depth++) {
    const node = nodes[sceneId];
    if (!node) break;
    const title = node.title || '';
    path.push({ scene: sceneId, title });
    if (node.type === 'end' || sceneId === terminal) {
      reached = true;
      break;
    }

    const raw = typeof node.choices === 'function' ? node.choices(E.state) : (node.choices || []);
    const choices = Array.isArray(raw) ? raw : [];
    const available = choices.filter(c => !isLocked({ E, nodes }, c));
    if (!available.length) break;

    // Score each choice by keyword match + progress factor
    let bestChoice = available[0];
    let bestScore = -999;

    for (const c of available) {
      const text = choiceText(c);
      let score = 0;
      // Keyword match
      for (const kw of keywords) {
        if (text.includes(kw)) score += 2;
      }
      // "不接/拒接" should be boosted only for end_refuse
      if (endingId !== 'end_refuse' && (text.includes('不接') || text.includes('拒接'))) score -= 10;
      // "指认" should be boosted for accusation endings
      if (endingId.startsWith('end_boss_') && text.includes('指认')) score += 5;
      // "归档/封起" boosted for end_archive
      if (endingId === 'end_archive' && (text.includes('封起') || text.includes('归档'))) score += 5;
      // "福生仓与公董局" boosted for deduction endings
      if ((endingId === 'end_conspiracy_detail' || endingId === 'end_true_hidden') && text.includes('福生仓与公董局')) score += 5;
      // Prefer choices that don't immediately end in "暂时不找" dead-ends
      if (text.includes('暂时不找') || text.includes('暂时不打扰')) score -= 1;

      // Simulate choice to estimate flag progress
      const prevFlags = clone(E.state.flags || {});
      if (c.effect) { try { c.effect(E.state); } catch {} }
      if (c.goto) {
        // Don't actually go, just track if flags changed
      }
      // Restore state
      E.state.flags = prevFlags;

      if (score > bestScore) { bestScore = score; bestChoice = c; }
    }

    // Execute best choice
    const text = choiceText(bestChoice);
    if (bestChoice.effect) { try { bestChoice.effect(E.state); } catch {} }
    if (bestChoice.goto) {
      const g = typeof bestChoice.goto === 'function' ? bestChoice.goto(E.state) : bestChoice.goto;
      if (g && nodes[g]) {
        // Handle auto-present at ch4_sun_support
        if (g === 'ch4_sun_support' && nodes[g].onPresent) {
          const item = E.hasItem?.('半张烟盒纸') ? { name: '半张烟盒纸' } : E.hasItem?.('福生仓地址') ? { name: '福生仓地址' } : null;
          if (item) {
            try {
              const r = nodes[g].onPresent(item, E.state);
              if (r?.goto && nodes[r.goto]) { E.go(r.goto); sceneId = E.state.currentScene || r.goto; continue; }
            } catch {}
          }
        }
        E.go(g);
        sceneId = E.state.currentScene || g;
        continue;
      }
    }
    sceneId = E.state.currentScene || sceneId;
  }

  finalFlags = clone(E.state.flags || {});
  const required = def.required_flags_end || {};
  const flagsMatch = Object.keys(required).length === 0 ||
    Object.entries(required).every(([k, v]) => {
      if (v === false) return !finalFlags[k];
      return finalFlags[k] === v;
    });

  return {
    endingId,
    title: def.title,
    description: def.description,
    ok: reached && flagsMatch,
    reachedEnding: reached,
    flagsMatch,
    finalScene: sceneId,
    steps: path.length,
    finalFlags: Object.fromEntries(Object.entries(finalFlags).filter(([_, v]) => v).sort()),
    terminal_scene: terminal,
  };
}

// ==== 主程序 ====
const allEndings = Object.keys(ENDING_DEFS);
const results = [];
const listOnly = args.list;

if (listOnly) {
  console.log('\n可用结局:');
  for (const [id, def] of Object.entries(ENDING_DEFS)) {
    console.log(`  --ending=${id}`);
    console.log(`    ${def.title} — ${def.description}`);
    const req = def.required_flags_end;
    if (req && Object.keys(req).length) {
      console.log(`    目标: ${Object.entries(req).map(([k,v])=>`${k}=${v}`).join(', ')}`);
    }
    console.log();
  }
  process.exit(0);
}

const target = args.ending;

console.log('🎯 雾锁迷踪 · 结局猎手\n');

const targets = target ? [target] : Object.keys(ENDING_DEFS);

for (const id of targets) {
  process.stdout.write(`  🔍 ${id} (${ENDING_DEFS[id]?.title || '?'})... `);
  const result = huntEnding(id);
  results.push(result);
  if (result.ok) {
    console.log(`✅ 第${result.steps}步到达 ${result.finalScene}`);
  } else {
    console.log(`❌ ${result.reachedEnding ? '场景到了但条件不符' : '未到达'} 停于 ${result.finalScene}`);
  }
}

console.log('\n📊 汇总:');
let passed = 0;
for (const r of results) {
  const mark = r.ok ? '✅' : '❌';
  if (r.ok) passed++;
  console.log(`  ${mark} ${r.endingId}: ${r.title} — ${r.steps}步${r.ok ? '' : ' ❌'}`);
}
console.log(`\n${passed}/${results.length} 结局可达`);
