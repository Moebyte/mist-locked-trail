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

// 模拟推理弹窗环境，验证答错不跳失败节点，答对才进入成功节点。
reset({});
E.deductions = [
  {
    id: 'deduce_chen',
    question: '陈明远的真正死因最有可能是？',
    options: ['A. 因愧对学生而自杀', 'B. 被陆小姐灭口', 'C. 被吴校长灭口', 'D. 因情感纠葛'],
    correctIdx: 1,
    successNode: 'deduc_success',
    failNode: 'deduc_fail',
    requiredClues: [],
    solved: false,
  }
];
let wentTo = null;
let toast = '';
E.go = id => { wentTo = id; };
E.toast = msg => { toast = msg; };
E.deducEl = {
  style: { display: 'flex' },
  querySelector(selector) {
    if (selector !== '.deduc-options') return null;
    const container = {
      children: [],
      querySelector(sel) { return this.children.find(child => child.className?.includes('deduc-feedback')) || null; },
      appendChild(child) { this.children.push(child); return child; },
    };
    return container;
  }
};

E.submitDeduction('deduce_chen', 0);
assert(wentTo === null, `答错不应跳转 failNode，实际 goto=${wentTo}`);
assert(E.deducEl.style.display === 'flex', '答错后推理面板应保持打开');
assert(E.getFlag('deduction_deduce_chen_wrong_once'), '答错应记录 wrong_once flag');
assert(toast.includes('再想想'), `答错 toast 应提示再想想，实际：${toast}`);

E.submitDeduction('deduce_chen', 1);
assert(wentTo === 'deduc_success', `答对应进入成功节点，实际 goto=${wentTo}`);
assert(E.deductions[0].solved, '答对应标记 deduction solved');
assert(E.deducEl.style.display === 'none', '答对后推理面板应关闭');

// 早期 ch4_conclusion 应退役结案系统，只允许回到线索整理，不再归档/指认/周怀安结局分流。
reset({
  flags: {
    school_incomplete_closure: true,
    school_truth_partial_only: true,
    deduced_chen: true,
    chen_letter_packet_altered: true,
  },
  items: [
    { name: '陈明远残信', desc: '' },
    { name: '苏晚亭疑似遗书', desc: '' },
  ],
  clues: [
    { name: '推理结论：陈明远被灭口', desc: '' },
  ],
});
textOf('ch4_conclusion');
let list = choices('ch4_conclusion');
assert(hasChoice(list, '回到线索整理继续推理', 'ch3_wrapup'), `早期结案页应回到线索整理，实际 ${JSON.stringify(list)}`);
assert(!list.some(choice => choice.goto === 'end_archive'), `早期结案页不应再提供归档结局，实际 ${JSON.stringify(list)}`);
assert(!list.some(choice => choice.goto === 'ch4_accuse'), `早期结案页不应再提供冒然指认，实际 ${JSON.stringify(list)}`);
assert(!list.some(choice => choice.goto === 'ch4_revisit_zhou'), `早期结案页不应再提供周怀安结局分流，实际 ${JSON.stringify(list)}`);

let text = textOf('ch4_accuse');
assert(text.includes('这不是指认的时候'), `早期指认页应阻止过早指认，实际：${text}`);
list = choices('ch4_accuse');
assert(list.length === 1 && list[0].goto === 'ch3_wrapup', `早期指认页只应回到线索整理，实际 ${JSON.stringify(list)}`);

// 完整线不应被早期退役逻辑覆盖。
reset({
  flags: {
    deduced_fusheng: true,
    rescued_yufang: true,
  },
});
list = choices('ch4_conclusion');
assert(list.some(choice => choice.goto === 'ch4_accuse'), `完整线仍应保留正常指认/结案选择，实际 ${JSON.stringify(list)}`);

if (errors.length) {
  console.error('Deduction retry no early ending smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Deduction retry no early ending smoke passed.');
