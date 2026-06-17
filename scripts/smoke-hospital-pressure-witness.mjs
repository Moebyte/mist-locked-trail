#!/usr/bin/env node
import { loadStoryRuntime } from './story-harness.mjs';

const rt = loadStoryRuntime();
const { E } = rt;
const errors = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function reset(overrides = {}) {
  rt.resetState(overrides);
}

const dockEvidence = [
  { name: '清场指令', desc: '' },
  { name: '光华货运单', desc: '' },
];

const fullTruthFlags = {
  school_wu_three_proofs: true,
  deduced_fusheng: true,
};

reset({
  flags: {
    sun_fast_support: true,
    found_su_at_dock: true,
    found_yufang: true,
  },
  items: dockEvidence,
});
rt.renderNode('ch4_dock_escape');
const dockChoices = rt.choicesOf('ch4_dock_escape');
const hardConfront = dockChoices.find(choice => (choice.text || '').includes('当场质问傅启元'));
assert(hardConfront, '双救 + 一个便衣时应存在码头高风险质问选项');
hardConfront?.effect?.(E.state);
assert(E.dockExitRiskTier().key === 'lethal', `双救 + 一个便衣 + 码头对峙应在码头阶段 lethal，实际 ${JSON.stringify(E.dockExitRiskTier())}`);
assert(hardConfront?.goto?.(E.state) === 'end_dock_silenced', '双救 + 一个便衣 + 码头对峙不应进入医院，应直接进入码头灭口结局');
assert(!E.canEnterHospitalLine(), '码头 lethal 后不允许进入医院线');
rt.renderNode('ch4_dock_escape_finish');
assert(rt.choicesOf('ch4_dock_escape_finish').some(choice => choice.goto === 'end_dock_silenced'), '若码头已 lethal，逃离完成节点也必须挡回码头灭口');

reset({
  flags: {
    sun_fast_support: true,
    sun_fast_cover_escape: true,
    rescued_yufang: true,
    rescued_su: true,
    found_su_at_dock: true,
  },
  items: dockEvidence,
});
assert(E.hospitalWitnessProfile().count === 2, '双救路线应识别为双证人');
assert(E.canEnterHospitalLine(), '双救 + 借雾撤离才允许进入医院线');
assert(E.hospitalOutcomeTier().key === 'controlled', `双救 + 一便衣借雾撤离应是可控医院线，实际 ${JSON.stringify(E.hospitalOutcomeTier())}`);
assert(['solid', 'partial'].includes(E.truthCompletenessTier().key), `未找陆念薇前，双救真相应尚未完整，实际 ${JSON.stringify(E.truthCompletenessTier())}`);

E.setFlag('hospital_protect_witnesses', true);
E.setFlag('hospital_separate_witnesses', true);
E.setFlag('hospital_doctor_record', true);
assert(E.hospitalOutcomeTier().key === 'stable', `双救 + 保护证人 + 医生记录应进入稳定医院线，实际 ${JSON.stringify(E.hospitalOutcomeTier())}`);

E.setFlag('v07_lu_to_sun', true);
assert(E.truthCompletenessTier().key === 'complete', `双救 + 陆念薇正式口供应能真相完整，实际 ${JSON.stringify(E.truthCompletenessTier())}`);

reset({
  flags: {
    sun_wait_support: true,
    dock_full_support_entry: true,
    dock_sun_pressed_fu: true,
    dock_confront_fu: true,
    rescued_yufang: true,
    hospital_protect_witnesses: true,
    hospital_separate_witnesses: true,
    hospital_doctor_record: true,
    v07_lu_to_sun: true,
  },
  items: dockEvidence,
});
assert(E.hospitalWitnessProfile().count === 1, '单救路线应识别为单证人');
assert(['stable', 'controlled'].includes(E.hospitalOutcomeTier().key), `单救 + 老孙控场 + 医院保护可以是稳定/可控医院线，实际 ${JSON.stringify(E.hospitalOutcomeTier())}`);
assert(E.truthCompletenessTier().key !== 'complete', `单救路线即使医院可控，也不应达到真相完整，实际 ${JSON.stringify(E.truthCompletenessTier())}`);
assert(E.truthCompletenessTier().score <= 6, `单救路线真相完整度应有上限 6，实际 ${JSON.stringify(E.truthCompletenessTier())}`);

reset({
  flags: {
    ...fullTruthFlags,
    sun_fast_support: true,
    sun_fast_cover_escape: true,
    rescued_yufang: true,
    rescued_su: true,
    found_su_at_dock: true,
    hospital_force_su_identify: true,
    v07_lu_to_sun: true,
  },
  items: dockEvidence,
});
assert(E.hospitalOutcomeTier().key === 'unstable', `双救进入医院后，若立刻逼苏晚亭指认，应导致医院失控，实际 ${JSON.stringify(E.hospitalOutcomeTier())}`);
assert(!E.hospitalAllowsHidden(), '医院失控应锁住隐藏结局资格');
assert(!E.hospitalAllowsTrueHidden(), '医院失控应锁住真隐藏结局资格');
assert(E.v07ResolveEnding() === 'end_rescue', `医院失控但救出证人时，应降级为救援/普通路线，实际 ${E.v07ResolveEnding()}`);

reset({
  flags: {
    ...fullTruthFlags,
    sun_fast_support: true,
    sun_fast_cover_escape: true,
    rescued_yufang: true,
    rescued_su: true,
    found_su_at_dock: true,
    hospital_early_lu: true,
    hospital_interrogate_yufang: true,
    v07_lu_to_sun: true,
  },
  items: dockEvidence,
});
assert(E.canEnterHospitalLine(), '借雾撤离后的医院紧张线应允许成立');
assert(E.hospitalOutcomeTier().key === 'tense', `双救 + 医院内过早陆念薇 + 追问沈玉芳应为紧张医院线，实际 ${JSON.stringify(E.hospitalOutcomeTier())}`);
assert(!E.hospitalAllowsTrueHidden(), '紧张医院线应锁住真隐藏资格');
assert(E.hospitalAllowsHidden(), '紧张医院线若真相完整，仍可保留隐藏结局资格');
assert(E.v07ResolveEnding() !== 'end_true_hidden', '紧张医院线不应进入真隐藏结局');

reset({
  flags: {
    ...fullTruthFlags,
    sun_fast_support: true,
    sun_fast_cover_escape: true,
    rescued_yufang: true,
    rescued_su: true,
    found_su_at_dock: true,
    hospital_protect_witnesses: true,
    hospital_separate_witnesses: true,
    hospital_doctor_record: true,
    v07_lu_to_sun: true,
  },
  items: dockEvidence,
});
assert(E.hospitalOutcomeTier().key === 'stable', `稳定医院线应保持 stable，实际 ${JSON.stringify(E.hospitalOutcomeTier())}`);
assert(E.hospitalAllowsTrueHidden(), '稳定医院线 + 真相完整应允许真隐藏');

reset({
  flags: {
    sun_fast_support: true,
    sun_fast_cover_escape: true,
    rescued_yufang: true,
    rescued_su: true,
    found_su_at_dock: true,
  },
  items: dockEvidence,
});
rt.renderNode('ch4_hospital_conflict');
const hospitalChoices = rt.choicesOf('ch4_hospital_conflict').map(choice => choice.text || '');
assert(hospitalChoices.some(text => text.includes('分开保护证人')), '医院冲突应提供保护证人选项');
assert(hospitalChoices.some(text => text.includes('伤情记录')), '医院冲突应提供医生伤情记录选项');
assert(hospitalChoices.some(text => text.includes('苏晚亭立刻指认')), '双救时医院冲突应提供高风险苏晚亭指认选项');

if (errors.length) {
  console.error('Hospital pressure witness smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Hospital pressure witness smoke passed.');
