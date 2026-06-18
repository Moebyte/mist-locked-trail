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

function choices(id) {
  rt.renderNode(id);
  return rt.choicesOf(id).map(choice => ({
    text: choice.text || choice.fogText || '',
    goto: typeof choice.goto === 'function' ? choice.goto(E.state) : choice.goto,
    hasEffect: typeof choice.effect === 'function',
  }));
}

function hasChoice(list, fragment, goto) {
  return list.some(choice => choice.text.includes(fragment) && (!goto || choice.goto === goto));
}

const fullItems = [{ name: '清场指令', desc: '' }, { name: '光华货运单', desc: '' }];
const fullClues = [{ name: '公董局公文纸', desc: '' }, { name: '教具箱走私', desc: '' }];

// 第三段推理成功后，应直接进入最终落笔，不再补医院/陆念薇。
reset({});
let list = choices('deduc_fusheng_ok');
assert(hasChoice(list, '写下最终结案材料', 'ch4_final_closure'), `deduc_fusheng_ok 应显示最终落笔入口，实际 ${JSON.stringify(list)}`);

// 有证人但医院没处理：wrapup 应先导向医院，不能直接开放第三段推理。
reset({
  flags: {
    deduced_chen: true,
    deduced_lu_zhao: true,
    found_yufang: true,
    found_su_at_dock: true,
    rescued_yufang: true,
    rescued_su: true,
  },
  items: fullItems,
  clues: fullClues,
});
list = choices('ch3_wrapup');
assert(hasChoice(list, '先完成医院线', 'ch4_hospital_conflict'), `有证人但医院未完成，应先进入医院线，实际 ${JSON.stringify(list)}`);
assert(!list.some(choice => choice.text.includes('第三段推理') && choice.hasEffect), `医院未完成时不应开放第三段推理，实际 ${JSON.stringify(list)}`);

// 医院已处理但陆念薇未定：wrapup 应先导向陆念薇，不能直接开放第三段推理。
reset({
  flags: {
    deduced_chen: true,
    deduced_lu_zhao: true,
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
list = choices('ch3_wrapup');
assert(hasChoice(list, '先处理陆念薇', 'ch4_lu_confrontation'), `医院完成但陆念薇未定，应先处理陆念薇，实际 ${JSON.stringify(list)}`);
assert(!list.some(choice => choice.text.includes('第三段推理') && choice.hasEffect), `陆念薇未定时不应开放第三段推理，实际 ${JSON.stringify(list)}`);

// 有证人且医院/陆小姐完成：wrapup 才开放第三段推理。
reset({
  flags: {
    deduced_chen: true,
    deduced_lu_zhao: true,
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
list = choices('ch3_wrapup');
assert(list.some(choice => choice.text.includes('第三段推理') && choice.hasEffect), `医院和陆小姐完成后，应开放第三段推理，实际 ${JSON.stringify(list)}`);

// 无证人：完成第二段后可直接开放第三段推理。
reset({
  flags: {
    deduced_chen: true,
    deduced_lu_zhao: true,
    dock_entry_committed: true,
    missed_both_at_dock: true,
  },
  items: fullItems,
  clues: fullClues,
});
list = choices('ch3_wrapup');
assert(list.some(choice => choice.text.includes('第三段推理') && choice.hasEffect), `无证人路线应直接开放第三段推理，实际 ${JSON.stringify(list)}`);

// 第三段完成后，无论有无证人，终局节点只负责写最终结案材料。
reset({
  flags: {
    deduced_fusheng: true,
    found_yufang: true,
    found_su_at_dock: true,
    rescued_yufang: true,
    rescued_su: true,
    hospital_protect_witnesses: true,
    v07_choice_protect_witnesses: true,
    v07_lu_statement: true,
  },
  items: fullItems,
  clues: fullClues,
});
list = choices('ch4_final_closure');
assert(list.some(choice => choice.text.includes('最终结案材料') && choice.goto && choice.goto.startsWith('end_')), `第三段完成后应直接写结局，实际 ${JSON.stringify(list)}`);
assert(!list.some(choice => choice.goto === 'ch4_hospital_conflict' || choice.goto === 'ch4_lu_confrontation'), `第三段完成后不应再补医院/陆小姐，实际 ${JSON.stringify(list)}`);

// 零证人全物证：第三段完成后直接收束为空仓余证。
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

// wrapup 中第三段完成后应有明显最终落笔入口。
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
assert(hasChoice(list, '写下最终结案材料', 'ch4_final_closure'), `ch3_wrapup 第三段完成后应显示最终落笔入口，实际 ${JSON.stringify(list)}`);

if (errors.length) {
  console.error('Final closure flow smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Final closure flow smoke passed.');
