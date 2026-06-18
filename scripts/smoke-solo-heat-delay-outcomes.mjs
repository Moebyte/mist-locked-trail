#!/usr/bin/env node
import { loadStoryRuntime } from './story-harness.mjs';

const h = loadStoryRuntime();
const { E } = h;
const errors = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function reset(overrides = {}) {
  h.resetState(overrides);
}

function renderChoices(id) {
  h.renderNode(id);
  return h.choicesOf(id);
}

function choiceTexts(id) {
  return renderChoices(id).map(choice => choice.text || choice.fogText || '');
}

function nodeText(id) {
  h.renderNode(id);
  const node = h.nodes[id];
  if (!node) return '';
  return typeof node.text === 'function' ? node.text(E.state) : (node.text || '');
}

function has(texts, fragment) {
  return texts.some(text => text.includes(fragment));
}

function joined(texts) {
  return texts.join('\n');
}

const baseSolo = {
  flags: {
    deduced_chen: true,
    deduced_lu_zhao: true,
    dock_force_solo_entry: true,
    dock_solo_entry_requested: true,
    dock_solo_entry: true,
    dock_entry_committed: true,
  },
  clues: [
    { name: '王巡官遗留纸条', desc: '' },
    { name: '陈明远的信', desc: '' },
    { name: '恐吓信', desc: '' },
    { name: '翡翠镯', desc: '' },
  ],
  items: [{ name: '翡翠镯', desc: '' }],
};

// 1) 无硬证据 + 低 heat / 低 delay => 双救。
reset({
  ...baseSolo,
  flags: {
    ...baseSolo.flags,
    dock_solo_no_evidence_rush: true,
    dock_solo_search_committed: true,
  },
});
let tier = E.soloDockOutcomeTier();
assert(tier.key === 'no_evidence_dual_rescue', `无证据低风险应进入双救，实际 ${tier.key}`);
assert(tier.score < 4, `无证据低风险总分应小于 4，实际 ${tier.score}`);
assert(E.routeSoloDockDeepByHeatDelay() === 'ch4_dock_deep_dual', '无证据低风险应路由到双人暗室');

// 2) 只拿一类硬证据：清场指令 or 运单 => 救出一方。
reset({
  ...baseSolo,
  flags: {
    ...baseSolo.flags,
    dock_solo_partial_evidence_sweep: true,
    dock_solo_search_committed: true,
  },
  clues: [...baseSolo.clues, { name: '公董局公文纸', desc: '' }],
  items: [...baseSolo.items, { name: '清场指令', desc: '' }],
});
tier = E.soloDockOutcomeTier();
assert(tier.key === 'partial_evidence_one_rescue', `只拿清场指令应进入一方救出，实际 ${tier.key}`);
assert(tier.score >= 4 && tier.score < 7, `只拿清场指令总分应为中风险 [4,7)，实际 ${tier.score}`);
assert(E.routeSoloDockDeepByHeatDelay() === 'ch4_dock_deep_trace', '只拿清场指令应路由到只剩一方/苏晚亭被转走');

reset({
  ...baseSolo,
  flags: {
    ...baseSolo.flags,
    dock_solo_partial_evidence_sweep: true,
    dock_solo_search_committed: true,
  },
  clues: [...baseSolo.clues, { name: '教具箱走私', desc: '' }],
  items: [...baseSolo.items, { name: '光华货运单', desc: '' }],
});
tier = E.soloDockOutcomeTier();
assert(tier.key === 'partial_evidence_one_rescue', `只拿货运单应进入一方救出，实际 ${tier.key}`);
assert(tier.score >= 4 && tier.score < 7, `只拿货运单总分应为中风险 [4,7)，实际 ${tier.score}`);
assert(E.routeSoloDockDeepByHeatDelay() === 'ch4_dock_deep_trace', '只拿货运单应路由到只剩一方/苏晚亭被转走');

// 3) 全证据但没有额外冒进时，应仍是中风险，不能过早空暗室。
reset({
  ...baseSolo,
  flags: {
    ...baseSolo.flags,
    dock_solo_full_evidence_sweep: true,
    dock_solo_search_committed: true,
  },
  clues: [
    ...baseSolo.clues,
    { name: '公董局公文纸', desc: '' },
    { name: '教具箱走私', desc: '' },
  ],
  items: [
    ...baseSolo.items,
    { name: '清场指令', desc: '' },
    { name: '光华货运单', desc: '' },
  ],
});
tier = E.soloDockOutcomeTier();
assert(tier.score >= 4 && tier.score < 7, `全证据基础路线应为中风险 [4,7)，实际 ${tier.score}`);
assert(tier.key === 'partial_evidence_one_rescue', `全证据但操作稳时应仍救出一方，实际 ${tier.key}`);
assert(E.routeSoloDockDeepByHeatDelay() === 'ch4_dock_deep_trace', '全证据但操作稳时不应路由到空暗室');

// 4) 全证据 + 多个额外冒进 heat，score>=7 才一个都没救出；之后不能进医院。
reset({
  ...baseSolo,
  flags: {
    ...baseSolo.flags,
    dock_solo_full_evidence_sweep: true,
    dock_solo_search_committed: true,
    dock_shelf_shortcut: true,
    dock_inner_office_rushed: true,
  },
  clues: [
    ...baseSolo.clues,
    { name: '公董局公文纸', desc: '' },
    { name: '教具箱走私', desc: '' },
  ],
  items: [
    ...baseSolo.items,
    { name: '清场指令', desc: '' },
    { name: '光华货运单', desc: '' },
  ],
});
tier = E.soloDockOutcomeTier();
assert(tier.key === 'full_evidence_no_rescue', `score>=7 应错过救人窗口，实际 ${tier.key}`);
assert(tier.score >= 7, `高风险总分应 >= 7，实际 ${tier.score}`);
assert(E.routeSoloDockDeepByHeatDelay() === 'ch4_dock_deep_empty_heat', 'score>=7 应路由到空暗室');
let texts = choiceTexts('ch4_dock_deep_empty_heat');
assert(has(texts, '逃出码头') || has(texts, '撤出福生仓'), '高风险空暗室后应推进逃出码头/撤出福生仓');
texts = choiceTexts('ch4_dock_escape_evidence_only');
assert(!has(texts, '医院'), '高风险无人救出后，不应触发医院线');
assert(has(texts, '带证据撤出福生仓') || has(texts, '整理证据'), '高风险无人救出后，应进入证据收束');

// 5) 真实入口页只展示叙事取舍，不暴露 heat / delay / 总分等内部实现。
reset(baseSolo);
texts = choiceTexts('ch4_dock_solo_search_choice');
const visibleChoiceText = joined(texts);
assert(has(texts, '不碰公文和货箱'), 'solo 搜查页应提供无证据直奔救人选项');
assert(has(texts, '只拿蓝封清场指令'), 'solo 搜查页应提供只拿指令选项');
assert(has(texts, '只翻教具箱货运单'), 'solo 搜查页应提供只拿运单选项');
assert(has(texts, '都查清'), 'solo 搜查页应提供全证据选项');
assert(!/heat|delay|总分|低风险|中风险|高风险/.test(visibleChoiceText), '玩家选项不应暴露 heat/delay/总分/风险档内部机制');
const visibleBody = nodeText('ch4_dock_solo_search_choice');
assert(!/heat|delay|总分|低风险|中风险|高风险/.test(visibleBody), '玩家正文不应暴露 heat/delay/总分/风险档内部机制');

if (errors.length) {
  console.error('Solo heat-delay outcome smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Solo heat-delay outcome smoke passed.');
