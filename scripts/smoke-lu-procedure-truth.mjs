#!/usr/bin/env node
import { loadStoryRuntime } from './story-harness.mjs';

const rt = loadStoryRuntime();
const { E } = rt;
const errors = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function reset(flags = {}, items = [], clues = []) {
  rt.resetState({ flags, items, clues });
}

function choiceTexts() {
  rt.renderNode('ch4_lu_confrontation');
  return rt.choicesOf('ch4_lu_confrontation').map(choice => choice.text || choice.fogText || '');
}

const fullItems = [{ name: '清场指令', desc: '' }, { name: '光华货运单', desc: '' }];

// 1) 稳定医院 + 全物证 + 老孙封锁，陆念薇可进入正式口供。
reset({
  rescued_yufang: true,
  dock_sun_pressed_fu: true,
  dock_full_support_entry: true,
  hospital_protect_witnesses: true,
  hospital_separate_witnesses: true,
  hospital_doctor_record: true,
  v07_choice_hold_blockade: true,
}, fullItems);
assert(E.luCredibilityScore() >= 6, `稳定老孙线陆小姐可信度应足够，实际 ${E.luCredibilityScore()}`);
assert(E.luProcedureRiskScore() <= 3, `稳定老孙线程序风险应可控，实际 ${E.luProcedureRiskScore()}`);
assert(E.luAllowsFormalStatement(), '稳定老孙线 + 全物证应允许陆念薇正式口供');
let texts = choiceTexts();
assert(texts.some(text => text.includes('交给老孙')), '陆念薇可正式口供时应显示交给老孙选项');

// 2) 公董局已经在码头出面，会显著提高程序风险，阻止正式口供，但仍可私下写材料。
reset({
  rescued_yufang: true,
  dock_escaped_during_sun_standoff: true,
  v07_choice_blockade_after_interference: true,
  hospital_protect_witnesses: true,
  hospital_doctor_record: true,
}, fullItems);
assert(!E.luAllowsFormalStatement(), '公董局已出面后，不应允许轻易转正式口供');
assert(E.luProcedureRiskScore() >= 4, `公董局出面应提高程序风险，实际 ${E.luProcedureRiskScore()}`);
texts = choiceTexts();
assert(!texts.some(text => text.includes('交给老孙，换正式口供')), '公董局介入后不应显示顺畅正式口供选项');
assert(texts.some(text => text.includes('写下傅启元的下一步安排')) || texts.some(text => text.includes('反压程序')), '公董局介入后应退为私下口供/受阻口供');

// 3) 医院失控时，陆念薇倾向退缩。
reset({
  rescued_yufang: true,
  rescued_su: true,
  found_su_at_dock: true,
  hospital_force_su_identify: true,
  hospital_early_lu: true,
}, fullItems);
assert(E.hospitalOutcomeTier().key === 'unstable', `该场景应为医院失控，实际 ${JSON.stringify(E.hospitalOutcomeTier())}`);
assert(E.luCredibilityScore() < 6, `医院失控应压低陆念薇可信度，实际 ${E.luCredibilityScore()}`);
texts = choiceTexts();
assert(texts.some(text => text.includes('暂时别逼她')), '医院失控时应提供暂时别逼陆念薇的选项');

// 4) 周怀安过早入场会提高医院压力并降低证人稳定，但不直接影响真相底分。
reset({ rescued_yufang: true, rescued_su: true, found_su_at_dock: true }, fullItems);
const basePressure = E.hospitalPressureScore();
const baseWitness = E.witnessStabilityScore();
const baseTruth = E.truthBaseScore();
E.setFlag('hospital_triage_zhou_early', true);
assert(E.hospitalPressureScore() === basePressure + 1, `周怀安过早入场应 pressure +1，实际 ${basePressure} -> ${E.hospitalPressureScore()}`);
assert(E.witnessStabilityScore() === baseWitness - 1, `周怀安过早入场应 witness -1，实际 ${baseWitness} -> ${E.witnessStabilityScore()}`);
assert(E.truthBaseScore() === baseTruth, '周怀安不应直接改变真相底分');

// 5) 苏晚亭在场且医院先保护/医生记录时，周怀安可作为情绪锚点补一点稳定。
reset({
  rescued_yufang: true,
  rescued_su: true,
  found_su_at_dock: true,
  hospital_protect_witnesses: true,
  hospital_doctor_record: true,
}, fullItems);
assert(E.witnessStabilityScore() >= 8, `保护后周怀安情绪锚点应让证人稳定较高，实际 ${E.witnessStabilityScore()}`);

if (errors.length) {
  console.error('Lu procedure truth smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Lu procedure truth smoke passed.');
