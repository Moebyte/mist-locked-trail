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

function has(texts, fragment) {
  return texts.some(text => text.includes(fragment));
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
assert(E.routeSoloDockDeepByHeatDelay() === 'ch4_dock_deep_trace', '只拿货运单应路由到只剩一方/苏晚亭被转走');

// 3) 全证据 + 高 delay => 一个都没救出；之后只能带证据逃出码头，不能进医院。
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
assert(tier.key === 'full_evidence_no_rescue', `全证据应错过救人窗口，实际 ${tier.key}`);
assert(E.routeSoloDockDeepByHeatDelay() === 'ch4_dock_deep_empty_heat', '全证据应路由到空暗室');
let texts = choiceTexts('ch4_dock_deep_empty_heat');
assert(has(texts, '逃出码头') || has(texts, '撤出福生仓'), '全证据空暗室后应推进逃出码头/撤出福生仓');
texts = choiceTexts('ch4_dock_escape_evidence_only');
assert(!has(texts, '医院'), '全证据但无人救出后，不应触发医院线');
assert(has(texts, '带证据撤出福生仓') || has(texts, '整理证据'), '全证据但无人救出后，应进入证据收束');

// 4) 真实入口页必须显式提示 heat / delay，并提供三种取舍。
reset(baseSolo);
texts = choiceTexts('ch4_dock_solo_search_choice');
assert(has(texts, '不碰公文和货箱'), 'solo 搜查页应提供无证据直奔救人选项');
assert(has(texts, '只拿蓝封清场指令'), 'solo 搜查页应提供只拿指令选项');
assert(has(texts, '只翻教具箱货运单'), 'solo 搜查页应提供只拿运单选项');
assert(has(texts, '都查清'), 'solo 搜查页应提供全证据选项');

if (errors.length) {
  console.error('Solo heat-delay outcome smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Solo heat-delay outcome smoke passed.');
