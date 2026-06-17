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

reset({ flags: { rescued_yufang: true, rescued_su: true, found_su_at_dock: true } });
let t = targets('ch4_dock_escape_finish');
let x = texts('ch4_dock_escape_finish').join('\n');
assert(t.length === 1 && t[0] === 'ch4_hospital_conflict', `逃离码头后应只能去医院冲突，实际 ${t.join(', ')}`);
assert(!x.includes('事务所'), '逃离码头后不应出现直接回事务所选项');

reset({ flags: { rescued_yufang: true, rescued_su: true, found_su_at_dock: true } });
t = targets('ch4_hospital_protect_witnesses');
assert(t.length === 1 && t[0] === 'ch4_lu_confrontation', `保护证人后应进入陆念薇线，实际 ${t.join(', ')}`);
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

if (errors.length) {
  console.error('Hospital flow smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Hospital flow smoke passed.');
