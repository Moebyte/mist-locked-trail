#!/usr/bin/env node
import { loadStoryRuntime } from './story-harness.mjs';

const rt = loadStoryRuntime();
const { E, nodes } = rt;
const errors = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function reset(overrides = {}) {
  rt.resetState(overrides);
}

function choices(id) {
  rt.renderNode(id);
  return rt.choicesOf(id).map(choice => ({
    text: choice.text || choice.fogText || '',
    goto: typeof choice.goto === 'function' ? choice.goto(E.state) : choice.goto,
  }));
}

function hasChoice(list, fragment, goto) {
  return list.some(choice => choice.text.includes(fragment) && (!goto || choice.goto === goto));
}

const fullItems = [{ name: '清场指令', desc: '' }, { name: '光华货运单', desc: '' }];
const fullClues = [{ name: '公董局公文纸', desc: '' }, { name: '教具箱走私', desc: '' }];

// 第三段推理成功后应直接出现终局收束入口。
reset({});
let list = choices('deduc_fusheng_ok');
assert(hasChoice(list, '进入终局收束', 'ch4_final_closure'), `deduc_fusheng_ok 应显示终局收束入口，实际 ${JSON.stringify(list)}`);

// 有证人但医院没处理：终局收束应先导向医院。
reset({
  flags: {
    deduced_fusheng: true,
    found_yufang: true,
    found_su_at_dock: true,
    rescued_yufang: true,
    rescued_su: true,
  },
  items: fullItems,
  clues: fullClues,
});
list = choices('ch4_final_closure');
assert(hasChoice(list, '先去医院', 'ch4_hospital_conflict'), `有证人但医院未处理，应先去医院，实际 ${JSON.stringify(list)}`);

// 医院已处理但陆念薇未定：应先导向陆念薇。
reset({
  flags: {
    deduced_fusheng: true,
    found_yufang: true,
    found_su_at_dock: true,
    rescued_yufang: true,
    rescued_su: true,
    hospital_protect_witnesses: true,
    v07_choice_protect_witnesses: true,
  },
  items: fullItems,
  clues: fullClues,
});
list = choices('ch4_final_closure');
assert(hasChoice(list, '处理陆念薇', 'ch4_lu_confrontation'), `医院已处理但陆念薇未定，应先处理陆念薇，实际 ${JSON.stringify(list)}`);

// 医院和陆念薇都处理完：应可直接写最终结案材料。
reset({
  flags: {
    deduced_fusheng: true,
    found_yufang: true,
    found_su_at_dock: true,
    rescued_yufang: true,
    rescued_su: true,
    hospital_protect_witnesses: true,
    hospital_separate_witnesses: true,
    hospital_doctor_record: true,
    v07_choice_protect_witnesses: true,
    v07_lu_statement: true,
  },
  items: fullItems,
  clues: fullClues,
});
list = choices('ch4_final_closure');
assert(list.some(choice => choice.text.includes('最终结案材料') && choice.goto && choice.goto.startsWith('end_')), `医院与陆念薇完成后，应直接导向某个结局，实际 ${JSON.stringify(list)}`);

// 零证人证据线：第三段推理完成后也能直接收束，不应强制医院。
reset({
  flags: {
    deduced_fusheng: true,
    dock_entry_committed: true,
    missed_both_at_dock: true,
  },
  items: fullItems,
  clues: fullClues,
});
list = choices('ch4_final_closure');
assert(list.some(choice => choice.text.includes('最终结案材料') && choice.goto === 'end_evidence_only'), `零证人全物证应直接收束为空仓余证，实际 ${JSON.stringify(list)}`);

// wrapup 中第三段完成后应有明显终局入口。
reset({
  flags: {
    deduced_chen: true,
    deduced_lu_zhao: true,
    deduced_fusheng: true,
    dock_entry_committed: true,
    missed_both_at_dock: true,
  },
  items: fullItems,
  clues: fullClues,
});
list = choices('ch3_wrapup');
assert(hasChoice(list, '进入终局收束', 'ch4_final_closure'), `ch3_wrapup 第三段完成后应显示终局收束入口，实际 ${JSON.stringify(list)}`);

if (errors.length) {
  console.error('Final closure flow smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Final closure flow smoke passed.');
