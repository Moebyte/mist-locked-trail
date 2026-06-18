#!/usr/bin/env node
import { loadStoryRuntime } from './story-harness.mjs';

const rt = loadStoryRuntime();
const { E, nodes } = rt;
const errors = [];
const warnings = [];

function fail(message) { errors.push(message); }
function warn(message) { warnings.push(message); }

function fresh(overrides = {}) {
  rt.resetState(overrides);
}

function named(list = []) {
  return list.map(name => ({ name, desc: 'fuzz preset' }));
}

const COMMON_ITEMS = [
  '苏晚亭的照片', '苏晚亭的银发夹', '陈明远的信', '陈明远残信', '苏晚亭疑似遗书',
  '永昌当票', '翡翠镯', '三人合影', '日记残页', '法租界地图', '半张烟盒纸',
  '光华货运单', '清场指令', '暗室刻痕拓片'
];

const PRESENT_ITEMS = [
  '苏晚亭的照片', '苏晚亭的银发夹', '陈明远的信', '陈明远残信', '苏晚亭疑似遗书',
  '翡翠镯', '三人合影', '日记残页', '半张烟盒纸', '光华货运单', '清场指令'
];

const PRESETS = [
  {
    name: 'empty',
    state: {}
  },
  {
    name: 'guanghua-common-only',
    state: {
      flags: { deduced_chen: true, school_incomplete_closure: true, school_truth_partial_only: true },
      items: named(['永昌当票']),
      clues: named(['推理结论：陈明远被灭口', '三人合影', '光华小学箱子异常', '光华小学不完整结论'])
    }
  },
  {
    name: 'wuai-without-su-home',
    state: {
      flags: { deduced_chen: true, chen_letter_packet_altered: true, school_incomplete_closure: true },
      items: named(['陈明远残信', '苏晚亭疑似遗书']),
      clues: named(['陈明远残信', '苏晚亭疑似遗书'])
    }
  },
  {
    name: 'wuai-blocked-by-su-home',
    state: {
      flags: { deduced_chen: true, chen_letter_packet_altered: true, school_incomplete_closure: true, su_mother_knows_zhou_fiance: true },
      items: named(['陈明远残信', '苏晚亭疑似遗书']),
      clues: named(['陈明远残信', '苏晚亭疑似遗书', '苏母知道周怀安婚约', '为情而去说法存疑'])
    }
  },
  {
    name: 'zhou-jade-full',
    state: {
      flags: { deduced_chen: true, shown_map_to_landlord: true, got_wang_note: true },
      items: named(['翡翠镯', '半张烟盒纸', '陈明远的信']),
      clues: named(['法租界地图', '福生仓标识', '王巡官遗留纸条', '陆念薇旧名'])
    }
  },
  {
    name: 'fusheng-ready',
    state: {
      flags: { deduced_chen: true, deduced_lu_zhao: true, shown_map_to_landlord: true, got_wang_note: true, school_wu_three_proofs: true },
      items: named(['陈明远的信', '三人合影', '日记残页', '半张烟盒纸']),
      clues: named(['推理结论：陈明远被灭口', '推理结论：黑衣男是暗线', '陈明远的信', '203 室恐吓信', '三人合影', '苏晚亭日记残页', '福生仓标识', '王巡官遗留纸条'])
    }
  },
  {
    name: 'dock-dual-witness',
    state: {
      flags: { deduced_chen: true, deduced_lu_zhao: true, deduced_fusheng: true, found_yufang: true, rescued_yufang: true, found_su_at_dock: true, rescued_su: true, presented_su_keepsake: true },
      items: named(['苏晚亭的银发夹', '三人合影', '陈明远的信', '光华货运单']),
      clues: named(['苏晚亭认出银发夹', '沈玉芳证词', '推理结论：法租界利益链', '公董局公文纸', '教具箱走私'])
    }
  },
  {
    name: 'solo-lantern-candidate',
    state: {
      flags: { deduced_chen: true, deduced_lu_zhao: true, deduced_fusheng: true, dock_solo_entry: true, dock_exit_side_lane: true, found_yufang: true, rescued_yufang: true, found_su_at_dock: true, rescued_su: true, solo_darkroom_marks: true, solo_rescuer_trust: true, hospital_stable: true, lu_private: true },
      items: named(['光华货运单', '清场指令', '暗室刻痕拓片']),
      clues: named(['推理结论：法租界利益链', '沈玉芳证词', '公董局公文纸', '教具箱走私', '暗室刻痕'])
    }
  }
];

function cloneState(state) {
  return JSON.parse(JSON.stringify(state || {}));
}

function nodeText(id) {
  const node = nodes[id];
  if (!node) throw new Error(`场景丢失：${id}`);
  if (typeof node.effect === 'function') node.effect(E.state);
  const text = typeof node.text === 'function' ? node.text(E.state) : node.text;
  return String(text || '');
}

function getChoices(id) {
  const node = nodes[id];
  if (!node) throw new Error(`场景丢失：${id}`);
  const choices = typeof node.choices === 'function' ? node.choices(E.state) : node.choices;
  return Array.isArray(choices) ? choices : [];
}

function checkTarget(target, context) {
  if (target === undefined || target === null || target === '') return;
  if (typeof target !== 'string') {
    fail(`${context}: goto 返回非字符串：${JSON.stringify(target)}`);
    return;
  }
  if (!nodes[target]) fail(`${context}: goto 指向不存在场景 ${target}`);
}

function checkChoice(choice, context) {
  if (!choice || typeof choice !== 'object') return;
  if (choice.goto === undefined) return;
  try {
    if (typeof choice.when === 'function' && !choice.when(E.state)) return;
    const target = typeof choice.goto === 'function' ? choice.goto(E.state) : choice.goto;
    checkTarget(target, context);
  } catch (err) {
    fail(`${context}: 计算 choice.goto 抛错：${err.message}`);
  }
}

function checkOnPresent(id, itemName, context) {
  const node = nodes[id];
  if (typeof node?.onPresent !== 'function') return;
  try {
    const before = cloneState(E.state);
    const result = node.onPresent({ name: itemName, desc: 'fuzz item' }, E.state);
    E.state = before;
    if (!result) return;
    if (result.goto !== undefined) checkTarget(result.goto, `${context} onPresent(${itemName})`);
    if (result.text !== undefined && typeof result.text !== 'string') fail(`${context} onPresent(${itemName}): text 不是字符串`);
    if (result.goto === undefined && result.text === undefined) warn(`${context} onPresent(${itemName}): 返回对象但无 goto/text`);
  } catch (err) {
    fail(`${context} onPresent(${itemName}) 抛错：${err.message}`);
  }
}

function inspectNode(id, preset) {
  const snapshot = cloneState(E.state);
  try {
    nodeText(id);
  } catch (err) {
    fail(`[${preset.name}] 渲染 ${id} 抛错：${err.message}`);
    E.state = snapshot;
    return;
  }

  try {
    for (const choice of getChoices(id)) checkChoice(choice, `[${preset.name}] ${id} 选项「${choice.text || choice.fogText || '无文本'}」`);
  } catch (err) {
    fail(`[${preset.name}] 枚举 ${id} choices 抛错：${err.message}`);
  }

  for (const item of PRESENT_ITEMS) checkOnPresent(id, item, `[${preset.name}] ${id}`);
  E.state = snapshot;
}

function crawlFrom(start, preset, maxDepth = 5) {
  const queue = [{ id: start, depth: 0 }];
  const seen = new Set();
  while (queue.length) {
    const { id, depth } = queue.shift();
    const key = `${id}@${depth}`;
    if (seen.has(key) || !nodes[id]) continue;
    seen.add(key);
    inspectNode(id, preset);
    if (depth >= maxDepth) continue;
    let choices;
    try { choices = getChoices(id); } catch { continue; }
    for (const choice of choices) {
      if (!choice?.goto) continue;
      try {
        const target = typeof choice.goto === 'function' ? choice.goto(E.state) : choice.goto;
        if (typeof target === 'string' && nodes[target] && !target.startsWith('end_')) queue.push({ id: target, depth: depth + 1 });
      } catch {}
    }
  }
}

const criticalStarts = [
  'ch3_wrapup', 'ch4_conclusion', 'ch4_accuse', 'ch4_revisit_zhou', 'ch4_pawnshop',
  'ch4_suzhou_creek', 'ch4_dock_who_dual', 'ch4_dock_escape_finish', 'ch4_final_closure'
].filter(id => nodes[id]);

for (const preset of PRESETS) {
  fresh(preset.state);
  for (const item of COMMON_ITEMS) {
    if (!E.hasItem(item)) E.addItem(item, 'fuzz common item');
  }
  for (const start of criticalStarts) crawlFrom(start, preset, 3);
}

// 全仓库静态图检查：所有静态 goto 必须存在。
for (const [id, node] of Object.entries(nodes)) {
  const choices = typeof node.choices === 'function' ? [] : (Array.isArray(node.choices) ? node.choices : []);
  for (const choice of choices) {
    if (typeof choice.goto === 'string' && !nodes[choice.goto]) fail(`[static] ${id} 选项「${choice.text || '无文本'}」指向不存在场景 ${choice.goto}`);
  }
}

if (warnings.length) {
  console.warn('Story state fuzz warnings:');
  for (const warning of warnings.slice(0, 50)) console.warn(`- ${warning}`);
  if (warnings.length > 50) console.warn(`... ${warnings.length - 50} more warnings`);
}

if (errors.length) {
  console.error('Story state fuzz failed:');
  for (const error of errors.slice(0, 80)) console.error(`- ${error}`);
  if (errors.length > 80) console.error(`... ${errors.length - 80} more errors`);
  process.exit(1);
}

console.log(`Story state fuzz passed: ${PRESETS.length} presets, ${criticalStarts.length} start nodes.`);
