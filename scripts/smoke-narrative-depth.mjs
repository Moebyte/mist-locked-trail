#!/usr/bin/env node
import { loadStoryRuntime } from './story-harness.mjs';

const errors = [];
const reports = [];
const h = loadStoryRuntime();
const { E } = h;

function assertChoiceTarget(sceneId, target) {
  h.renderNode(sceneId);
  const ok = h.choicesOf(sceneId).some(c => c.goto === target || (typeof c.goto === 'function' && c.goto(E.state) === target));
  if (!ok) throw new Error(`${sceneId} 缺少通往 ${target} 的选择`);
}

function choiceTargets(sceneId) {
  h.renderNode(sceneId);
  return h.choicesOf(sceneId).map(c => typeof c.goto === 'function' ? c.goto(E.state) : c.goto);
}

function rescueReadyFlags(extra = {}) {
  return {
    found_su_at_dock: true,
    presented_su_keepsake: true,
    ...extra,
  };
}

function hiddenReadyFlags(extra = {}) {
  return rescueReadyFlags({
    presented_threat_to_wu: true,
    presented_photo_to_wu: true,
    presented_university_to_wu: true,
    school_wu_three_proofs: true,
    school_wu_full_confront: true,
    ...extra,
  });
}

function highQualityFlags(extra = {}) {
  return rescueReadyFlags({
    rescued_yufang: true,
    rescued_su: true,
    deduced_fusheng: true,
    fu_waybill_exposed: true,
    fu_clearance_exposed: true,
    v07_witnesses_protected: true,
    v07_lu_confronted: true,
    v07_rejected_fu_deal: true,
    ...extra,
  });
}

function finalQualityScore() {
  if (typeof E.finalTruthQuality === 'function') return E.finalTruthQuality().score;
  if (typeof E.truthCompletenessTier === 'function') return E.truthCompletenessTier().score;
  return E.v07InvestigationQuality().score;
}

function testHospitalConflict() {
  h.resetState({ flags: rescueReadyFlags({ deduced_fusheng: true }) });
  h.renderNode('ch4_dock_escape_finish');
  h.assertFlag('rescued_yufang');
  h.assertFlag('rescued_su');
  h.goByTarget('ch4_hospital_triage');
  h.goByTarget('ch4_hospital_conflict');
  h.assertFlag('v07_triangle_conflict_seen');
  h.assertClue('医院走廊冲突');

  const targets = h.choicesOf('ch4_hospital_conflict').map(c => typeof c.goto === 'function' ? c.goto(E.state) : c.goto);
  // 无支援时默认 solo 模式，不包含老孙封码头分支
  if (!targets.includes('ch4_hospital_protect_witnesses')) throw new Error('医院冲突缺少保护证人分支');
  if (!targets.includes('ch4_lu_confrontation')) throw new Error('医院冲突缺少逼陆念薇分支');
  if (targets.includes('ch4_hospital_pressure_fu') && E.dockSupportMode() === 'solo') throw new Error('solo 模式不应包含老孙封码头分支');
  reports.push('PASS 医院走廊三方冲突入口与分支(' + targets.length + '个分支)');
}

function testHighQualityNaturalEnding() {
  h.resetState({ flags: hiddenReadyFlags({ deduced_fusheng: true, fu_waybill_exposed: true, fu_clearance_exposed: true }) });
  h.renderNode('ch4_dock_escape_finish');
  h.goByTarget('ch4_hospital_triage');
  h.goByTarget('ch4_hospital_conflict');
  h.goByTarget('ch4_hospital_protect_witnesses');
  h.assertFlag('v07_witnesses_protected');
  h.goByTarget('ch4_lu_confrontation');
  h.assertFlag('v07_lu_confronted');
  h.goByText('交给老孙');
  h.assertFlag('v07_lu_to_sun');
  h.goByText('拒绝交易');
  h.assertFlag('v07_rejected_fu_deal');

  const legacyQuality = E.v07InvestigationQuality();
  if (legacyQuality.scope === 'deprecated_after_fusheng' && legacyQuality.score > 5) {
    throw new Error(`福生仓后旧质量分应退役封顶，实际 ${legacyQuality.score}`);
  }
  const finalScore = finalQualityScore();
  if (finalScore < 10) throw new Error(`高质量路线最终真相分过低：${finalScore}`);
  const ending = E.v07ResolveEnding();
  if (ending !== 'end_true_hidden') throw new Error(`高质量路线预期真隐藏结局，实际 ${ending}，finalScore=${finalScore}`);
  reports.push(`PASS 高质量路线自然分流到 ${ending}，finalScore=${finalScore}`);
}

function testHiddenEndingRequiresSchoolThreeProofs() {
  h.resetState({ flags: rescueReadyFlags({ rescued_yufang: true, deduced_fusheng: true, fu_waybill_exposed: true, fu_clearance_exposed: true, v07_witnesses_protected: true, v07_lu_confronted: true, v07_rejected_fu_deal: true }) });
  const ending = E.v07ResolveEnding();
  if (ending === 'end_conspiracy_detail' || ending === 'end_true_hidden' || ending === 'end_hidden_truth') throw new Error('未完成校长三证物质询时，不应进入隐藏/真隐藏结局');
  reports.push(`PASS 隐藏结局需要校长三证物闭环，未完成时分流到 ${ending}`);
}

function testHiddenEndingRequiresYufangRescue() {
  h.resetState({ flags: highQualityFlags({ rescued_yufang: false, rescued_su: false, found_su_at_dock: false, school_wu_three_proofs: true, school_wu_full_confront: true }) });
  const ending = E.v07ResolveEnding();
  if (ending === 'end_conspiracy_detail' || ending === 'end_true_hidden' || ending === 'end_hidden_truth') throw new Error(`未救出沈玉芳时，不应进入隐藏/真隐藏结局；实际 ${ending}`);
  reports.push(`PASS 隐藏结局需要救出沈玉芳，未救出任何人时分流到 ${ending}`);
}

function testHiddenButNotTrueHiddenWithoutSuRescue() {
  h.resetState({
    flags: highQualityFlags({
      rescued_su: false,
      found_su_at_dock: false,
      presented_su_keepsake: false,
      su_moved_from_dock: true,
      rescued_yufang: true,
      school_wu_three_proofs: true,
      school_wu_full_confront: true,
      hospital_protect_witnesses: true,
      hospital_doctor_record: true,
      v07_lu_statement: true,
    })
  });
  const finalScore = finalQualityScore();
  const ending = E.v07ResolveEnding();
  if (ending !== 'end_conspiracy_detail' && ending !== 'end_hidden_truth') throw new Error(`救出沈玉芳但未救出苏晚亭时，应进入隐藏层级而非真隐藏；实际 ${ending}，finalScore=${finalScore}`);
  const targets = choiceTargets('ch4_conclusion');
  if (!targets.includes('end_conspiracy_detail') && !targets.includes('end_hidden_truth')) throw new Error('救出沈玉芳但未救出苏晚亭时，ch4_conclusion 应允许隐藏结局入口');
  if (targets.includes('end_true_hidden')) throw new Error('未救出苏晚亭时，ch4_conclusion 不应出现真隐藏结局入口');
  reports.push(`PASS 救出沈玉芳但未救出苏晚亭时进入隐藏层级 ${ending}，finalScore=${finalScore}`);
}

function testConclusionChoicesRespectHiddenGate() {
  h.resetState({ flags: highQualityFlags() });
  let targets = choiceTargets('ch4_conclusion');
  if (targets.includes('end_conspiracy_detail') || targets.includes('end_true_hidden') || targets.includes('end_hidden_truth')) throw new Error('ch4_conclusion 未完成校长三证物时，不应出现或跳往隐藏/真隐藏结局');
  if (!targets.includes('end_rescue') && !targets.includes('end_conspiracy') && !targets.includes('end_partial_truth')) throw new Error('ch4_conclusion 未完成校长三证物时，自然结案应降级到普通好结局/普通结局');

  h.resetState({ flags: highQualityFlags({ school_wu_three_proofs: true, school_wu_full_confront: true, v07_lu_to_sun: true }) });
  targets = choiceTargets('ch4_conclusion');
  if (!targets.includes('end_true_hidden')) throw new Error('ch4_conclusion 完成校长三证物、正式口供并救出苏晚亭后，应允许进入真隐藏结局');
  reports.push('PASS ch4_conclusion 选项层也受光华三证物、沈玉芳获救、苏晚亭获救门槛约束');
}

function testPressureAffectsDockRoute() {
  h.resetState({
    inGameTime: { day: 2, hour: 12, minute: 0 },
    pressure: { heat: 0, deadline: { day: 2, hour: 23, minute: 0 } },
  });
  // 新版：进入码头前按支援模式路由（默认 SOLO）
  const safeRoute = E.routeDockByPressure();
  if (safeRoute !== 'ch4_dock_solo_infiltration') throw new Error(`低压力默认返回 SOLO 模式，实际 ${safeRoute}`);
  // 进入码头后测试时间压力
  E.setFlag('dock_entry_committed', true);
  const deepSearch = E.routeDockByPressure();
  if (deepSearch !== 'ch4_dock_full_search') throw new Error(`低压力+已进入码头应返回完整搜查，实际 ${deepSearch}`);
  E.addHeat(8, '测试高热度');
  const hotRoute = E.routeDockByPressure();
  if (['ch4_dock_solo_infiltration', 'ch4_dock_full_search'].includes(hotRoute)) throw new Error(`高热度+已进入码头不应仍允许完整/默认搜查，实际 ${hotRoute}`);
  if (!['ch4_dock_limited_search', 'ch4_dock_rescue_only', 'ch4_dock_cleared'].includes(hotRoute)) throw new Error(`高热度路线异常：${hotRoute}`);
  reports.push(`PASS 压力热度影响福生仓路线：未进入 ${safeRoute}，已进入低压 ${deepSearch}，高压 ${hotRoute}`);
}

function testLateNaturalEnding() {
  h.resetState({ flags: { missed_deadline: true } });
  const ending = E.v07ResolveEnding();
  if (ending !== 'end_too_late') throw new Error(`超期路线预期 end_too_late，实际 ${ending}`);
  reports.push('PASS 超期状态自然分流到 end_too_late');
}

function testFuOfferBranches() {
  h.resetState({ flags: { fu_waybill_exposed: true } });
  h.renderNode('ch4_fu_private_offer');
  const targets = h.choicesOf('ch4_fu_private_offer').map(c => typeof c.goto === 'function' ? c.goto(E.state) : c.goto);
  if (!targets.includes('ch4_conclusion')) throw new Error('傅启元交易节点缺少回到结案的选择');
  const pressChoice = h.choicesOf('ch4_fu_private_offer').find(c => c.text.includes('申报'));
  if (!pressChoice || (pressChoice.when && !pressChoice.when(E.state))) throw new Error('掌握证据时应允许用《申报》和老孙反制傅启元');
  reports.push('PASS 傅启元私下交易节点具备反制分支');
}

try {
  assertChoiceTarget('ch4_conclusion', 'end_archive');
  testHospitalConflict();
  testHighQualityNaturalEnding();
  testHiddenEndingRequiresSchoolThreeProofs();
  testHiddenEndingRequiresYufangRescue();
  testHiddenButNotTrueHiddenWithoutSuRescue();
  testConclusionChoicesRespectHiddenGate();
  testPressureAffectsDockRoute();
  testLateNaturalEnding();
  testFuOfferBranches();
} catch (err) {
  errors.push(err.message);
}

console.log('Narrative depth smoke reports:');
for (const report of reports) console.log(`- ${report}`);

if (errors.length) {
  console.error('\nNarrative depth smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Narrative depth smoke passed: ${reports.length} checks.`);
