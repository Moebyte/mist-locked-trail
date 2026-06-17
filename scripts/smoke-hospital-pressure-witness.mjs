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
    sun_fast_support: true,
    sun_fast_cover_escape: true,
    rescued_yufang: true,
    rescued_su: true,
    found_su_at_dock: true,
    hospital_force_su_identify: true,
  },
  items: dockEvidence,
});
assert(E.hospitalOutcomeTier().key === 'unstable', `双救但立刻逼苏晚亭指认，应导致医院失控，实际 ${JSON.stringify(E.hospitalOutcomeTier())}`);

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
