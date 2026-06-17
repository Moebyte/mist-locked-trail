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
