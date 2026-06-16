#!/usr/bin/env node
/**
 * 雾锁迷踪 全面线路核查脚本
 * 覆盖：可达性、死路、选项逻辑、flag依赖、物品/线索一致性、结局触发条件
 */

import fs from 'fs';

const baseDir = 'src';
const storyCode = fs.readFileSync(baseDir + '/story.js', 'utf8');
const engineCode = fs.readFileSync(baseDir + '/engine.js', 'utf8');
const mainCode = fs.readFileSync(baseDir + '/main.js', 'utf8');

const moduleFiles = [
  'src/story-modules/runtime-contract.js',
  'src/story-modules/consistency.js',
  'src/story-modules/evidence.js',
  'src/story-modules/evidence-polish.js',
  'src/story-modules/narrative-depth.js',
  'src/story-modules/ui-responsive.js',
];

// Setup global stubs
globalThis.window = { addEventListener: () => {} };
globalThis.document = { addEventListener: () => {}, write: () => {}, getElementById: () => null };
globalThis.localStorage = { getItem: () => null, setItem: () => {} };

// Load all code
let combined = engineCode + '\n' + storyCode + '\n';
for (const f of moduleFiles) {
  combined += '\n' + fs.readFileSync(f, 'utf8');
}
combined += '\n' + mainCode + '\n';
combined += '\n;globalThis.__nodes = nodes; globalThis.__E = E; globalThis.__applyGameplayImprovements = applyGameplayImprovements;';

const fn = new Function(combined);
fn();

try { globalThis.__applyGameplayImprovements(); } catch(e) {}
for (const name of ['applyRuntimeContract', 'applyConsistencyImprovements', 'applyEvidenceImprovements', 'applyEvidencePolishImprovements', 'applyNarrativeDepthV07', 'applyUIResponsive']) {
  if (typeof globalThis[name] === 'function') {
    try { globalThis[name](); } catch(e) {}
  }
}

const nodes = globalThis.__nodes;
const E = globalThis.__E;

const errors = [];
const warnings = [];
const info = [];
function err(m) { errors.push(m); }
function warn(m) { warnings.push(m); }
function log(m) { info.push(m); }

// 1. Basic stats
const allNodeIds = Object.keys(nodes);
const endNodes = [];
const normalNodes = [];
for (const id of allNodeIds) {
  (nodes[id].type === 'end' ? endNodes : normalNodes).push(id);
}
log(`📊 基础统计：${allNodeIds.length} 个节点（${normalNodes.length} 普通 + ${endNodes.length} 结局）`);

// 2. Collect all goto targets
const allGotoTargets = new Set();
const nodeGotoMap = {}; // nodeId -> string[]
const dynamicGotoNodes = [];

for (const id of allNodeIds) {
  const node = nodes[id];
  if (!node.choices) continue;

  const choices = typeof node.choices === 'function'
    ? (() => { try { return node.choices({flags:{},items:[],clues:[],contacts:[]}); } catch(e) { return []; } })()
    : node.choices;
  if (!Array.isArray(choices)) continue;

  nodeGotoMap[id] = [];
  for (const c of choices) {
    if (!c.goto) continue;
    if (typeof c.goto === 'function') {
      dynamicGotoNodes.push(id);
      try {
        const target = c.goto({flags:{},items:[],clues:[],contacts:[]});
        if (typeof target === 'string') { allGotoTargets.add(target); nodeGotoMap[id].push(target); }
      } catch(e) { nodeGotoMap[id].push('[dynamic - needs state]'); }
    } else {
      allGotoTargets.add(c.goto);
      nodeGotoMap[id].push(c.goto);
    }
  }

  if (node.auto) {
    dynamicGotoNodes.push(id);
    try {
      const t = typeof node.auto === 'function' ? node.auto({flags:{},items:[],clues:[]}) : node.auto;
      if (typeof t === 'string') { allGotoTargets.add(t); nodeGotoMap[id].push(t + '(auto)'); }
    } catch(e) {}
  }
}

// 3. Static reachability from ch1_open
const reachable = new Set();
const queue = ['ch1_open'];
while (queue.length > 0) {
  const id = queue.shift();
  if (reachable.has(id)) continue;
  reachable.add(id);
  const targets = nodeGotoMap[id] || [];
  for (const t of targets) {
    const clean = t.replace(/ \(.*?\)/, '').replace(/\[.*?\]/, '');
    if (clean && nodes[clean] && !reachable.has(clean)) queue.push(clean);
  }
  // Also check onPresent handlers for goto strings
  const node = nodes[id];
  if (node && node.onPresent) {
    const src = node.onPresent.toString();
    const m = [...src.matchAll(/goto:\s*['"]([^'"]+)['"]/g)];
    for (const match of m) {
      const t = match[1];
      if (nodes[t] && !reachable.has(t)) queue.push(t);
    }
  }
}

const unreachable = allNodeIds.filter(id => id !== 'ch1_open' && !reachable.has(id));
if (unreachable.length > 0) warn(`\n⚠️ 不可达节点（${unreachable.length}个）：` + unreachable.slice(0,10).join(', '));
else log('\n✅ 所有节点可达');

// 4. Dead ends (non-end, no choices, no auto)
const deadEnds = [];
for (const id of allNodeIds) {
  const node = nodes[id];
  if (node.type === 'end') continue;
  try {
    const choices = typeof node.choices === 'function' ? node.choices({flags:{}}) : node.choices;
    if (!choices || (Array.isArray(choices) && choices.length === 0)) {
      if (!node.auto) deadEnds.push(id);
    }
  } catch(e) { deadEnds.push(id + '(eval err)'); }
}
if (deadEnds.length > 0) err(`\n❌ 死路节点：${deadEnds.length}个 - ${deadEnds.join(', ')}`);
else log('✅ 无死路节点');

// 5. Dangling goto targets
const dangling = [];
for (const id of allNodeIds) {
  const targets = nodeGotoMap[id] || [];
  for (const t of targets) {
    const clean = t.replace(/ \(.*?\)/, '').replace(/\[.*?\]/, '');
    if (clean && !nodes[clean] && !clean.includes('[')) dangling.push(`${id}→${clean}`);
  }
}
if (dangling.length > 0) err(`\n❌ 悬空goto：${dangling.length}个 - ${dangling.join(', ')}`);
else log('✅ 所有goto目标有效');

// 6. Ending analysis
log('\n📋 结局分析：');
for (const endId of endNodes) {
  const node = nodes[endId];
  const linkedFrom = [];
  for (const id of allNodeIds) {
    const targets = nodeGotoMap[id] || [];
    for (const t of targets) if (t.includes(endId)) linkedFrom.push(id);
    if (nodes[id] && nodes[id].onPresent) {
      const src = nodes[id].onPresent.toString();
      if (src.includes(endId) || src.includes(`'${endId}'`) || src.includes(`"${endId}"`)) linkedFrom.push(id + '(present)');
    }
  }
  for (const id of dynamicGotoNodes) {
    try {
      const n = nodes[id];
      const cs = typeof n.choices === 'function' ? JSON.stringify(n.choices({flags:{}})) : JSON.stringify(n.choices);
      if (cs.includes(endId)) linkedFrom.push(id + '(dyn)');
    } catch(e) {}
  }
  const unique = [...new Set(linkedFrom)];
  log(`  ${endId}: ${node.title} → 来源 ${unique.length} 处` + (unique.length === 0 ? ' ⚠️ 无路径！' : ''));
}

// 7. Flag analysis
log('\n🏷️ 关键flag核查：');
const criticalFlags = [
  'rescued_su','rescued_yufang','found_su_at_dock','su_moved_from_dock','su_trace_only',
  'missed_deadline','deduced_fusheng','took_case','read_letter','sister_case',
  'got_photo_letter','presented_threat_to_wu','presented_photo_to_wu','presented_note',
  'presented_jade_to_zhou','hidden_end','hidden_end_unlocked',
  'v07_witnesses_protected','v07_lu_confronted','v07_rejected_fu_deal',
  'fu_waybill_exposed','fu_clearance_exposed','sun_waybill_convinced','sun_clearance_convinced',
  'zhou_understands_wanting','zhou_accepts_chen_link'
];

const allCode = combined + mainCode;
for (const flag of criticalFlags) {
  // Count set
  const setRe = new RegExp(`setFlag\\s*\\(\\s*['"]${flag}['"]`, 'g');
  const getRe = new RegExp(`getFlag\\s*\\(\\s*['"]${flag}['"]`, 'g');
  const setCount = (allCode.match(setRe) || []).length;
  const getCount = (allCode.match(getRe) || []).length;
  if (getCount > 0 && setCount === 0) {
    err(`  ❌ ${flag}: 被读取${getCount}次但从未设置！`);
  } else if (setCount > 0) {
    log(`  ${flag}: 设${setCount}次 | 读${getCount}次`);
  }
}

// 8. Choice overload
log('\n🔢 选项数量（≥5个的节点）：');
const overloaded = [];
for (const id of allNodeIds) {
  const node = nodes[id];
  if (node.type === 'end' || !node.choices) continue;
  try {
    const cs = typeof node.choices === 'function' ? node.choices({flags:{},items:[]}) : node.choices;
    if (Array.isArray(cs) && cs.length >= 5) {
      overloaded.push({ id, count: cs.length });
    }
  } catch(e) {}
}
overloaded.sort((a,b) => b.count - a.count);
if (overloaded.length > 0) {
  for (const o of overloaded) {
    const node = nodes[o.id];
    const title = node.title || '无标题';
    log(`  ${o.id} (${title}): ${o.count}个选项`);
  }
  warn(`\n⚠️ ${overloaded.length} 个节点选项≥5，需考虑是否合并或分层`);
} else {
  log('  无选项≥5的节点');
}

// 9. onPresent coverage
log('\n🔍 举证（onPresent）节点：');
const pNodes = allNodeIds.filter(id => nodes[id].onPresent);
for (const id of pNodes) {
  try {
    const src = nodes[id].onPresent.toString();
    const items = [...src.matchAll(/item\.name\s*===?\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
    log(`  ${id}: 可出示 [${items.join(', ')}]`);
  } catch(e) { log(`  ${id}: ${e.message}`); }
}
log(`  共 ${pNodes.length} 个举证节点`);

// 10. deduc targets
log('\n🧩 推理节点：');
for (const id of allNodeIds) {
  const node = nodes[id];
  const code = [node.text, node.effect, node.choices, node.onPresent, node.auto]
    .filter(Boolean).map(f => typeof f === 'function' ? f.toString() : '').join(' ');
  if (code.includes('deduc') || code.includes('Deduc') || node.title?.includes('推理')) {
    log(`  ${id}: ${node.title}`);
  }
}

// ── Report ──
const report = [
  '# 🕵️ 雾锁迷踪 · 全面线路核查报告',
  `> 生成时间: ${new Date().toISOString().replace('T',' ').slice(0,19)}`,
  '',
  '## 📊 总览',
  '',
  `| 指标 | 数值 |`,
  `|------|:----:|`,
  `| 节点总数 | ${allNodeIds.length} |`,
  `| 结局数 | ${endNodes.length} |`,
  `| 可达节点 | ${reachable.size}/${allNodeIds.length} |`,
  `| 不可达节点 | ${unreachable.length} |`,
  `| 死路节点 | ${deadEnds.length} |`,
  `| 悬空goto | ${dangling.length} |`,
  `| 举证节点 | ${pNodes.length} |`,
  `| ≥5选项节点 | ${overloaded.length} |`,
  '',
  errors.length > 0 ? '## ❌ 错误\n' + errors.map(e => `- ${e}`).join('\n') + '\n' : '✅ 无错误\n',
  warnings.length > 0 ? '## ⚠️ 警告\n' + warnings.map(w => `- ${w}`).join('\n') + '\n' : '✅ 无警告\n',
  '## ℹ️ 详细信息\n',
  ...info,
].join('\n');

fs.writeFileSync('docs/full-audit-report.md', report);
console.log('✅ 报告已写入 docs/full-audit-report.md');
console.log(report);
