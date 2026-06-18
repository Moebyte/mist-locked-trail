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

// 非三证光华小学结束后仍应保留案情推理/表层收束环节，而不是被本模块退役。
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
let list = choices('ch4_conclusion');
assert(hasChoice(list, '残信和疑似遗书', 'ch4_revisit_zhou'), `非三证光华后应保留周怀安表层收束入口，实际 ${JSON.stringify(list)}`);
assert(hasChoice(list, '暂时归档', 'end_archive'), `非三证光华后应保留暂时归档入口，实际 ${JSON.stringify(list)}`);
assert(hasChoice(list, '压成一份指认', 'ch4_accuse'), `非三证光华后应保留案情指认入口，实际 ${JSON.stringify(list)}`);

list = choices('ch4_accuse');
assert(hasChoice(list, '旧名、当票和203室', 'end_boss_lu'), `案情指认应保留陆小姐表层方向，实际 ${JSON.stringify(list)}`);
assert(hasChoice(list, '一直在盯陆小姐和沈玉芳', 'end_boss_zhao'), `案情指认应保留赵先生表层方向，实际 ${JSON.stringify(list)}`);
assert(hasChoice(list, '学校口径最能把事情压下去', 'end_boss_wu'), `案情指认应保留吴校长表层方向，实际 ${JSON.stringify(list)}`);

if (errors.length) {
  console.error('Deduction retry no early ending smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Deduction retry no early ending smoke passed.');
