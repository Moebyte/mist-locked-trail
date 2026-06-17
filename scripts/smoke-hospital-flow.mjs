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

function targets(id) {
  rt.renderNode(id);
  return rt.choicesOf(id).map(choice => typeof choice.goto === 'function' ? choice.goto(E.state) : choice.goto);
}

function texts(id) {
  rt.renderNode(id);
  return rt.choicesOf(id).map(choice => choice.text || choice.fogText || '');
}

function secondHospitalChoiceText(flags) {
  reset({ flags: { rescued_yufang: true, rescued_su: true, found_su_at_dock: true, ...flags } });
  return texts('ch4_hospital_conflict')[2] || '';
}

reset({ flags: { rescued_yufang: true, rescued_su: true, found_su_at_dock: true } });
let t = targets('ch4_dock_escape_finish');
let x = texts('ch4_dock_escape_finish').join('\n');
assert(t.length === 1 && t[0] === 'ch4_hospital_triage', `逃离码头后应先去医院后门安置，实际 ${t.join(', ')}`);
assert(!x.includes('事务所'), '逃离码头后不应出现直接回事务所选项');

reset({ flags: { rescued_yufang: true, rescued_su: true, found_su_at_dock: true } });
t = targets('ch4_hospital_triage');
x = texts('ch4_hospital_triage').join('\n');
assert(t.length === 4 && t.every(v => v === 'ch4_hospital_conflict'), `医院后门安置四个选择都应进入医院冲突，实际 ${t.join(', ')}`);
assert(x.includes('送进病房'), '医院后门安置应提供先送病房选项');
assert(x.includes('守住医院后门'), '医院后门安置应提供守后门选项');
assert(x.includes('周怀安'), '医院后门安置应提供周怀安提前认人选项');

reset({ flags: { rescued_yufang: true, rescued_su: true, found_su_at_dock: true } });
t = targets('ch4_hospital_protect_witnesses');
assert(t.includes('ch4_lu_confrontation'), `保护证人后应保留进入陆念薇线，实际 ${t.join(', ')}`);
assert(!t.includes('ch4_conclusion'), '保护证人后不应直接结案');

reset({ flags: { rescued_yufang: true, rescued_su: true, found_su_at_dock: true } });
t = targets('ch4_lu_confrontation');
assert(t.length === 3 && t.every(v => v === 'ch4_fu_private_offer'), `陆念薇三个选择都应进入傅启元后巷交易，实际 ${t.join(', ')}`);
assert(!t.includes('ch4_conclusion'), '陆念薇线不应直接跳过傅启元对峙去结案');

reset({ flags: { rescued_yufang: true, rescued_su: true, found_su_at_dock: true, fu_waybill_exposed: true, fu_clearance_exposed: true } });
t = targets('ch4_fu_private_offer');
assert(t.includes('ch4_conclusion'), '傅启元后巷交易后应能回事务所结案');
x = texts('ch4_fu_private_offer').join('\n');
assert(x.includes('回事务所整理结案材料'), '傅启元后巷交易的结案选项应明确“再回事务所”');

let second = secondHospitalChoiceText({ sun_fast_cover_escape: true, sun_fast_support: true });
assert(second.includes('连夜补人手去封码头'), `只有一个便衣撤离后，医院封码头选项应是补人手封码头，实际：${second}`);
assert(!second.includes('立刻封码头'), '只有一个便衣撤离后，不应显示“立刻封码头”');

second = secondHospitalChoiceText({ dock_sun_pressed_fu: true, sun_wait_support: true, sun_support_available: true });
assert(second.includes('守住码头封锁线'), `老孙已正面压过傅启元后，医院封码头选项应是守住封锁线，实际：${second}`);

second = secondHospitalChoiceText({ dock_escaped_during_sun_standoff: true, sun_wait_support: true, sun_support_available: true });
assert(second.includes('公董局已经插手'), `老孙带队但趁乱撤离后，医院封码头选项应提示公董局已经插手，实际：${second}`);

second = secondHospitalChoiceText({});
assert(second.includes('立刻封码头'), `普通状态下仍可显示立刻封码头，实际：${second}`);

if (errors.length) {
  console.error('Hospital flow smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Hospital flow smoke passed.');
