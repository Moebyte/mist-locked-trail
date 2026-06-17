#!/usr/bin/env node
import { loadStoryRuntime } from './story-harness.mjs';

const h = loadStoryRuntime();
const { E, nodes } = h;
const errors = [];
const reports = [];

const ENDINGS = [
  'end_refuse',
  'end_archive',
  'end_too_late',
  'end_boss_lu',
  'end_boss_zhao',
  'end_boss_wu',
  'end_conspiracy',
  'end_rescue',
  'end_conspiracy_detail',
  'end_zhou_chen_letter',
  'end_true_hidden',
  'end_dock_silenced',
];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function reset(overrides = {}) {
  h.resetState(overrides);
}

function targets(sceneId) {
  h.renderNode(sceneId);
  return h.choicesOf(sceneId).map(choice => typeof choice.goto === 'function' ? choice.goto(E.state) : choice.goto);
}

function hasTarget(sceneId, target) {
  return targets(sceneId).includes(target);
}

function highTruthFlags(extra = {}) {
  return {
    deduced_fusheng: true,
    fu_waybill_exposed: true,
    fu_clearance_exposed: true,
    v07_witnesses_protected: true,
    v07_lu_confronted: true,
    v07_rejected_fu_deal: true,
    school_wu_three_proofs: true,
    school_wu_full_confront: true,
    ...extra,
  };
}

function endingTitle(id) {
  return nodes[id]?.title || '(missing title)';
}

// 1. 结局节点集合必须正好 12 个有效结局。
for (const id of ENDINGS) {
  assert(nodes[id], `缺少结局节点：${id}`);
  assert(nodes[id]?.type === 'end', `${id} 不是 type=end，可能不会被记录为结局`);
}
assert(!nodes.end_conspiracy_trace, '旧的“雾后回声”结局节点 end_conspiracy_trace 应已移除/不再生成');
assert(!nodes.end_refuse_named, 'end_refuse_named 会导致“雨落无声”重复计数，应不存在');

// 2. 开场拒接结局。
reset();
assert(hasTarget('ch1_open', 'end_refuse'), '开场应能直接进入雨落无声');
reset();
h.renderNode('ch1_ask');
assert(h.choicesOf('ch1_ask').some(c => c.goto === 'end_refuse'), '问清后拒接也应归入同一个 end_refuse');
reports.push('PASS 雨落无声可达且不重复计数');

// 3. 普通归档 / 超时。
reset();
assert(hasTarget('ch4_conclusion', 'end_archive'), 'ch4_conclusion 应能自然分流到无声归档');
reset({ flags: { missed_deadline: true } });
assert(E.v07ResolveEnding() === 'end_too_late', 'missed_deadline 应自然分流到迟到一步');
assert(hasTarget('ch4_conclusion', 'end_too_late'), '超时状态下 ch4_conclusion 应能进入迟到一步');
reports.push('PASS 无声归档、迟到一步可达');

// 4. 三个错误指认结局。
reset();
const accuseTargets = targets('ch4_accuse');
for (const id of ['end_boss_lu', 'end_boss_zhao', 'end_boss_wu']) {
  assert(accuseTargets.includes(id), `指认节点缺少 ${id}`);
}
reports.push('PASS 三个错误指认结局可达');

// 5. 普通真相 / 救人结局。
reset({ flags: {
  deduced_fusheng: true,
  fu_waybill_exposed: true,
  fu_clearance_exposed: true,
  v07_lu_confronted: true,
  v07_rejected_fu_deal: true,
  rescued_yufang: false,
  rescued_su: false,
  v07_witnesses_protected: false,
  school_wu_three_proofs: false,
} });
assert(E.v07ResolveEnding() === 'end_conspiracy', `查明部分真相但无人获救应进入普通真相，实际 ${E.v07ResolveEnding()}`);
reset({ flags: { rescued_su: true } });
assert(E.v07ResolveEnding() === 'end_rescue', `救出苏晚亭但真相链不足应进入黎明灯火，实际 ${E.v07ResolveEnding()}`);
reports.push('PASS 普通真相、救人结局可达');

// 6. 隐藏 / 真隐藏。
reset({ flags: highTruthFlags({ rescued_yufang: true, rescued_su: false, su_moved_from_dock: true, v07_witnesses_protected: false }) });
assert(E.v07ResolveEnding() === 'end_conspiracy_detail', `救出沈玉芳但未救出苏晚亭应进入隐藏结局，实际 ${E.v07ResolveEnding()}`);
assert(hasTarget('ch4_conclusion', 'end_conspiracy_detail'), '救出沈玉芳但未救出苏晚亭时，终局选项应能进入隐藏结局');

reset({ flags: highTruthFlags({ rescued_yufang: true, rescued_su: true, found_su_at_dock: true }) });
assert(E.v07ResolveEnding() === 'end_true_hidden', `救出沈玉芳和苏晚亭应进入真隐藏，实际 ${E.v07ResolveEnding()}`);
assert(hasTarget('ch4_conclusion', 'end_true_hidden'), '救出沈玉芳和苏晚亭时，终局选项应能进入真隐藏结局');
reports.push('PASS 隐藏结局、真隐藏结局可达');

// 7. 吾爱晚亭坏路线特殊结局。
reset({
  flags: { presented_chen_letter_to_zhou: true, presented_su_last_letter_to_zhou: true },
  items: [{ name: '陈明远的信', desc: '' }, { name: '苏晚亭的遗书', desc: '' }],
});
assert(hasTarget('ch4_zhou_present_chen_letter', 'end_zhou_chen_letter') || hasTarget('ch4_zhou_present_su_last_letter', 'end_zhou_chen_letter'), '两封信并出后应能进入吾爱晚亭');
reports.push('PASS 吾爱晚亭可达');

// 8. 码头人手不足硬质问坏结局。
reset({ flags: { sun_fast_support: true, rescued_yufang: true, found_su_at_dock: true } });
assert(hasTarget('ch4_dock_escape', 'end_dock_silenced'), '只有一个便衣时，当场质问傅启元应能进入码头坏结局');
reports.push('PASS 码头人手不足硬质问坏结局可达');

if (errors.length) {
  console.error('Ending reachability smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  console.error('\nKnown ending list:');
  for (const id of ENDINGS) console.error(`- ${id}: ${endingTitle(id)}`);
  process.exit(1);
}

console.log('Ending reachability smoke passed.');
console.log('Reachable endings:');
for (const id of ENDINGS) console.log(`- ${id}: ${endingTitle(id)}`);
for (const report of reports) console.log(report);
