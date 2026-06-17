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

function testHospitalConflict() {
  h.resetState({ flags: rescueReadyFlags({ deduced_fusheng: true }) });
  h.renderNode('ch4_dock_escape_finish');
  h.assertFlag('rescued_yufang');
  h.assertFlag('rescued_su');
  h.goByTarget('ch4_hospital_conflict');
  h.assertFlag('v07_triangle_conflict_seen');
  h.assertClue('医院走廊冲突');

  const targets = h.choicesOf('ch4_hospital_conflict').map(c => typeof c.goto === 'function' ? c.goto(E.state) : c.goto);
  for (const target of ['ch4_hospital_protect_witnesses', 'ch4_hospital_pressure_fu', 'ch4_lu_confrontation']) {
    if (!targets.includes(target)) throw new Error(`医院冲突缺少分支：${target}`);
  }
  reports.push('PASS 医院走廊三方冲突入口与三分支');
}

function testHighQualityNaturalEnding() {
  h.resetState({ flags: hiddenReadyFlags({ deduced_fusheng: true, fu_waybill_exposed: true, fu_clearance_exposed: true }) });
  h.renderNode('ch4_dock_escape_finish');
  h.goByTarget('ch4_hospital_conflict');
  h.goByTarget('ch4_hospital_protect_witnesses');
  h.assertFlag('v07_witnesses_protected');
  h.goByTarget('ch4_lu_confrontation');
  h.assertFlag('v07_lu_confronted');
  h.goByTarget('ch4_fu_private_offer');
  h.assertFlag('v07_lu_statement');
  h.goByText('拒绝交易');
  h.assertFlag('v07_rejected_fu_deal');

  const quality = E.v07InvestigationQuality();
  if (quality.score < 10) throw new Error(`高质量路线分数过低：${quality.score}`);
  const ending = E.v07ResolveEnding();
  if (ending !== 'end_conspiracy_detail') throw new Error(`高质量路线预期隐藏结局，实际 ${ending}`);
  reports.push(`PASS 高质量路线自然分流到 ${ending}，score=${quality.score}`);
}

function testHiddenEndingRequiresSchoolThreeProofs() {
  h.resetState({ flags: rescueReadyFlags({ deduced_fusheng: true, fu_waybill_exposed: true, fu_clearance_exposed: true, v07_witnesses_protected: true, v07_lu_confronted: true, v07_rejected_fu_deal: true }) });
  const ending = E.v07ResolveEnding();
  if (ending === 'end_conspiracy_detail') throw new Error('未完成校长三证物质询时，不应进入隐藏结局');
  reports.push(`PASS 隐藏结局需要校长三证物闭环，未完成时分流到 ${ending}`);
}

function testTrueHiddenRequiresSuRescue() {
  h.resetState({
    flags: highQualityFlags({
      rescued_su: false,
      found_su_at_dock: false,
      su_moved_from_dock: true,
      school_wu_three_proofs: true,
      school_wu_full_confront: true,
    })
  });
  const quality = E.v07InvestigationQuality();
  const ending = E.v07ResolveEnding();
  if (ending === 'end_conspiracy_detail') throw new Error(`未救出苏晚亭时，不应进入真隐藏结局；quality=${quality.score}`);
  const targets = choiceTargets('ch4_conclusion');
  if (targets.includes('end_conspiracy_detail')) throw new Error('未救出苏晚亭时，ch4_conclusion 不应出现真隐藏结局入口');
  reports.push(`PASS 真隐藏结局需要救出苏晚亭，未救出时分流到 ${ending}，score=${quality.score}`);
}

function testConclusionChoicesRespectHiddenGate() {
  h.resetState({ flags: highQualityFlags() });
  let targets = choiceTargets('ch4_conclusion');
  if (targets.includes('end_conspiracy_detail')) throw new Error('ch4_conclusion 未完成校长三证物时，不应出现或跳往隐藏结局');
  if (!targets.includes('end_rescue') && !targets.includes('end_conspiracy')) throw new Error('ch4_conclusion 未完成校长三证物时，自然结案应降级到普通好结局/普通结局');

  h.resetState({ flags: highQualityFlags({ school_wu_three_proofs: true, school_wu_full_confront: true }) });
  targets = choiceTargets('ch4_conclusion');
  if (!targets.includes('end_conspiracy_detail')) throw new Error('ch4_conclusion 完成校长三证物并救出苏晚亭后，应允许进入真隐藏结局');
  reports.push('PASS ch4_conclusion 选项层也受光华三证物与苏晚亭获救门槛约束');
}

function testPressureAffectsDockRoute() {
  h.resetState({
    inGameTime: { day: 2, hour: 12, minute: 0 },
    pressure: { heat: 0, deadline: { day: 2, hour: 23, minute: 0 } },
  });
  const safeRoute = E.routeDockByPressure();
  if (safeRoute !== 'ch4_dock_full_search') throw new Error(`低压力应允许完整搜查，实际 ${safeRoute}`);
  E.addHeat(8, '测试高热度');
  const hotRoute = E.routeDockByPressure();
  if (hotRoute === 'ch4_dock_full_search') throw new Error('高热度不应仍允许完整搜查');
  if (!['ch4_dock_limited_search', 'ch4_dock_rescue_only', 'ch4_dock_cleared'].includes(hotRoute)) throw new Error(`高热度路线异常：${hotRoute}`);
  reports.push(`PASS 压力热度会影响福生仓路线：低压 ${safeRoute}，高压 ${hotRoute}`);
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
  testTrueHiddenRequiresSuRescue();
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
