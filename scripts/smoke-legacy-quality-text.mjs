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

function textOf(id) {
  rt.renderNode(id);
  const node = rt.nodes[id];
  return typeof node.text === 'function' ? String(node.text(E.state)) : String(node.text || '');
}

const fullItems = [{ name: '清场指令', desc: '' }, { name: '光华货运单', desc: '' }];
const fullClues = [{ name: '公董局公文纸', desc: '' }, { name: '教具箱走私', desc: '' }];

// 光华小学后、福生仓前：线索整理页应说明这是调查成熟度，不是最终结局分。
reset({
  flags: {
    deduced_chen: true,
    deduced_lu_zhao: true,
    school_wu_three_proofs: true,
  },
  clues: [{ name: '推理结论：陈明远被灭口', desc: '' }],
});
let text = textOf('ch3_wrapup');
assert(text.includes('调查成熟度'), `ch3_wrapup 应显示调查成熟度提示，实际：${text}`);
assert(text.includes('它不是最终结局分'), `ch3_wrapup 应说明不是最终结局分，实际：${text}`);
assert(text.includes('最终结局会在第三段推理后'), `ch3_wrapup 应说明最终结局由第三段后判定，实际：${text}`);

// 兼容旧结论页：也应提示旧分不是最终结局分。
reset({
  flags: {
    deduced_chen: true,
    deduced_lu_zhao: true,
  },
});
text = textOf('ch4_conclusion');
assert(text.includes('调查成熟度'), `ch4_conclusion 应显示调查成熟度提示，实际：${text}`);
assert(text.includes('不等同于最终结局分') || text.includes('不是最终结局分'), `ch4_conclusion 应说明不等同最终结局分，实际：${text}`);

// 第三段完成后：提示终局判定已切换到新体系。
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
text = textOf('ch3_wrapup');
assert(text.includes('终局判定已切换'), `第三段后 ch3_wrapup 应显示终局判定已切换，实际：${text}`);
assert(text.includes('旧的“推理质量分”只作诊断参考'), `第三段后应说明旧质量分只作诊断，实际：${text}`);
assert(text.includes('证人、物证、医院、陆念薇'), `第三段后应说明新终局因素，实际：${text}`);

if (errors.length) {
  console.error('Legacy quality text smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Legacy quality text smoke passed.');
