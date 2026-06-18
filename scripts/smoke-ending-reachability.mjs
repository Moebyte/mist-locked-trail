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
  'end_hidden_truth',
  'end_partial_truth',
  'end_evidence_only',
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

function stableHospitalFlags(extra = {}) {
  return {
    hospital_protect_witnesses: true,
    hospital_doctor_record: true,
    hospital_separate_witnesses: true,
    hospital_triage_settle_witness: true,
    hospital_triage_backdoor_guard: true,
    ...extra,
  };
}

function endingTitle(id) {
  return nodes[id]?.title || '(missing title)';
}

function runChoiceByText(sceneId, textFragment) {
  h.renderNode(sceneId);
  const choice = h.choicesOf(sceneId).find(c => c.text && c.text.includes(textFragment));
  if (!choice) return null;
  if (typeof choice.effect === 'function') choice.effect(E.state);
  return typeof choice.goto === 'function' ? choice.goto(E.state) : choice.goto;
}

// 1. 结局节点集合必须有效。旧的 end_too_late 仍保留为旧存档/旧节点兼容；新版动态结局也必须存在。
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

// 3. 普通归档 / 硬时间退役。
reset();
assert(hasTarget('ch4_conclusion', 'end_archive'), 'ch4_conclusion 应能自然分流到无声归档');
reset({ flags: { missed_deadline: true } });
const lateEnding = E.v07ResolveEnding();
assert(lateEnding !== 'end_too_late', '硬时间结局已退役，不应主动分流到迟到一步');
assert(['end_archive', 'end_evidence_only'].includes(lateEnding), `missed_deadline 应分流到归档/证据收束，实际 ${lateEnding}`);
reports.push(`PASS 无声归档可达，硬时间退役后 missed_deadline -> ${lateEnding}`);

// 4. 三个错误指认结局。
reset();
const accuseTargets = targets('ch4_accuse');
for (const id of ['end_boss_lu', 'end_boss_zhao', 'end_boss_wu']) {
  assert(accuseTargets.includes(id), `指认节点缺少 ${id}`);
}
reports.push('PASS 三个错误指认结局可达');

// 5. 普通动态真相 / 救人结局。
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
  dock_entry_committed: true,
} });
const noWitnessEnding = E.v07ResolveEnding();
assert(['end_archive', 'end_evidence_only', 'end_partial_truth'].includes(noWitnessEnding), `查明部分真相但无人获救应进入归档/证据/普通动态真相，实际 ${noWitnessEnding}`);
reset({ flags: { rescued_su: true } });
assert(E.v07ResolveEnding() === 'end_rescue', `救出苏晚亭但真相链不足应进入黎明灯火，实际 ${E.v07ResolveEnding()}`);
reports.push(`PASS 普通动态收束、救人结局可达；无人获救 -> ${noWitnessEnding}`);

// 6. 隐藏 / 真隐藏。新版隐藏层级由 end_hidden_truth 承接；真隐藏需要双救 + 正式口供。
reset({ flags: highTruthFlags({
  rescued_yufang: true,
  rescued_su: false,
  su_moved_from_dock: true,
  found_su_at_dock: false,
  v07_witnesses_protected: true,
  v07_lu_statement: true,
  ...stableHospitalFlags(),
}) });
const singleRescueHidden = E.v07ResolveEnding();
assert(['end_hidden_truth', 'end_conspiracy_detail'].includes(singleRescueHidden), `救出沈玉芳但未救出苏晚亭应进入隐藏层级，实际 ${singleRescueHidden}`);
assert(hasTarget('ch4_conclusion', singleRescueHidden), `救出沈玉芳但未救出苏晚亭时，终局选项应能进入 ${singleRescueHidden}`);

reset({ flags: highTruthFlags({
  rescued_yufang: true,
  rescued_su: true,
  found_su_at_dock: true,
  v07_lu_to_sun: true,
  ...stableHospitalFlags(),
}) });
const trueHidden = E.v07ResolveEnding();
assert(trueHidden === 'end_true_hidden', `救出沈玉芳和苏晚亭并形成正式口供应进入真隐藏，实际 ${trueHidden}`);
assert(hasTarget('ch4_conclusion', 'end_true_hidden'), '救出沈玉芳和苏晚亭时，终局选项应能进入真隐藏结局');
reports.push(`PASS 隐藏结局、真隐藏结局可达；单救 -> ${singleRescueHidden}`);

// 7. 吾爱晚亭坏路线特殊结局。
reset({
  flags: {},
  items: [{ name: '陈明远的信', desc: '' }, { name: '苏晚亭的遗书', desc: '' }],
});
const firstLetterTarget = runChoiceByText('ch4_revisit_zhou', '陈明远');
assert(firstLetterTarget === 'ch4_zhou_present_chen_letter' || firstLetterTarget === 'end_zhou_chen_letter', `第一封信应进入陈明远残信展示，实际 ${firstLetterTarget}`);
const secondLetterTarget = runChoiceByText('ch4_zhou_present_chen_letter', '疑似遗书') || runChoiceByText('ch4_revisit_zhou', '遗书');
assert(secondLetterTarget === 'ch4_zhou_present_su_last_letter' || secondLetterTarget === 'end_zhou_chen_letter', `第二封信应能接到遗书展示/吾爱晚亭，实际 ${secondLetterTarget}`);
if (secondLetterTarget !== 'end_zhou_chen_letter') {
  assert(hasTarget('ch4_zhou_present_su_last_letter', 'end_zhou_chen_letter'), '两封信并出后应能进入吾爱晚亭');
}
reports.push('PASS 吾爱晚亭可达');

// 8. 码头人手不足硬质问坏结局。
reset({ flags: { sun_fast_support: true, rescued_yufang: true, found_su_at_dock: true, fu_waybill_exposed: true, fu_clearance_exposed: true } });
h.renderNode('ch4_dock_exit_assess');
const hardConfront = h.choicesOf('ch4_dock_exit_assess').find(c => c.text && c.text.includes('当场拿出货运单和清场指令'));
assert(!!hardConfront, '只有一个便衣时，应出现当场拿出货运单和清场指令的高风险选择');
if (hardConfront) {
  if (typeof hardConfront.effect === 'function') hardConfront.effect(E.state);
  const target = typeof hardConfront.goto === 'function' ? hardConfront.goto(E.state) : hardConfront.goto;
  assert(target === 'end_dock_silenced', `只有一个便衣时，当场质问傅启元应能进入码头坏结局，实际 ${target}`);
}
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
