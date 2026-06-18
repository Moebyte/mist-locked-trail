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

function assertNoChoice(list, fragment, label) {
  assert(!list.some(choice => choice.text.includes(fragment)), `${label} 不应出现 ${fragment}，实际 ${JSON.stringify(list)}`);
}

function assertNoEarlyEndingSpoilers(text, label) {
  for (const word of ['走私团伙', '违禁品交易', '公董局公章', '法租界高层', '幕后操纵者', '真正的幕后']) {
    assert(!text.includes(word), `${label} 不应反向剧透：${word}，实际：${text}`);
  }
}

// 早期结案页应先形成“案卷写法”，而不是开发者式失败提示。此状态同时满足陆小姐与吴校长指认，但不满足赵先生。
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
    { name: '203 室恐吓信', desc: '' },
    { name: '三人合影', desc: '' },
    { name: '杭州旧案剪报', desc: '' },
    { name: '光华小学箱子异常', desc: '' },
  ],
});
let text = textOf('ch4_conclusion');
assert(text.includes('案卷'), `早期结案页应呈现案卷写法，实际：${text}`);
assert(text.includes('不是完整答案'), `早期结案页应说明不是完整答案，实际：${text}`);
assert(text.includes('更容易被人接受'), `早期结案页应说明表层答案的诱惑，实际：${text}`);
assertNoEarlyEndingSpoilers(text, '早期结案页');
let list = choices('ch4_conclusion');
assert(hasChoice(list, '残信和疑似遗书', 'ch4_revisit_zhou'), `有残信包时应提供周怀安入口，实际 ${JSON.stringify(list)}`);
assert(hasChoice(list, '暂时归档', 'end_archive'), `早期结案页应提供归档，实际 ${JSON.stringify(list)}`);
assert(hasChoice(list, '压成一份指认', 'ch4_accuse'), `有至少一个指认方向时应提供案情指认，实际 ${JSON.stringify(list)}`);

// 早期指认页应只显示有片面证据支撑的方向。
text = textOf('ch4_accuse');
assert(text.includes('有些名字已经被线索照到'), `早期指认页应说明片面证据方向，实际：${text}`);
assert(text.includes('不是破案'), `早期指认页应说明不是完整破案，实际：${text}`);
assertNoEarlyEndingSpoilers(text, '早期指认页');
list = choices('ch4_accuse');
assert(hasChoice(list, '旧名、当票和203室', 'end_boss_lu'), `有陆念旧名+203时应显示陆小姐指认，实际 ${JSON.stringify(list)}`);
assert(hasChoice(list, '学校口径最能把事情压下去', 'end_boss_wu'), `有光华小学表层证据时应显示吴校长指认，实际 ${JSON.stringify(list)}`);
assertNoChoice(list, '赵先生', '没有赵先生线索时');

// 只有光华小学表层证据时，只能指向吴校长。
reset({
  flags: {
    school_incomplete_closure: true,
    school_truth_partial_only: true,
    deduced_chen: true,
  },
  clues: [
    { name: '推理结论：陈明远被灭口', desc: '' },
    { name: '光华小学箱子异常', desc: '' },
    { name: '光华小学不完整结论', desc: '' },
  ],
});
list = choices('ch4_accuse');
assert(hasChoice(list, '吴校长', 'end_boss_wu'), `学校表层证据应显示吴校长方向，实际 ${JSON.stringify(list)}`);
assertNoChoice(list, '陆小姐', '仅学校表层证据时');
assertNoChoice(list, '赵先生', '仅学校表层证据时');

// 有赵先生/沈玉兰方向时，才出现赵先生指认。
reset({
  flags: {
    school_incomplete_closure: true,
    deduced_lu_zhao: true,
  },
  clues: [
    { name: '黑衣男人线索', desc: '' },
    { name: '沈玉兰的妹妹', desc: '' },
    { name: '推理结论：黑衣男是暗线', desc: '' },
  ],
});
list = choices('ch4_accuse');
assert(hasChoice(list, '赵先生', 'end_boss_zhao'), `赵先生+沈玉兰线索应显示赵先生方向，实际 ${JSON.stringify(list)}`);
assertNoChoice(list, '陆小姐', '仅赵先生线索时');
assertNoChoice(list, '吴校长', '仅赵先生线索时');

// 三个早期指认结局不得反向交代后期真相。
reset({
  flags: {
    school_incomplete_closure: true,
    school_truth_partial_only: true,
    deduced_chen: true,
  },
  clues: [
    { name: '推理结论：陈明远被灭口', desc: '' },
    { name: '203 室恐吓信', desc: '' },
    { name: '三人合影', desc: '' },
    { name: '杭州旧案剪报', desc: '' },
    { name: '光华小学箱子异常', desc: '' },
    { name: '黑衣男人线索', desc: '' },
    { name: '沈玉兰的妹妹', desc: '' },
  ],
});
for (const [id, title] of [['end_boss_lu', '面具之下'], ['end_boss_zhao', '提线木偶'], ['end_boss_wu', '师者无声']]) {
  text = textOf(id);
  assert(text.includes(`结局 · ${title}`), `${id} 应保留四字结局名，实际：${text}`);
  assert(text.includes('案卷') || text.includes('报告'), `${id} 应呈现早期案卷收束，实际：${text}`);
  assertNoEarlyEndingSpoilers(text, id);
}

// 完整线不应被早期结局桥覆盖。
reset({
  flags: {
    deduced_fusheng: true,
    rescued_yufang: true,
  },
});
text = textOf('ch4_conclusion');
assert(!text.includes('几种不同的写法'), `完整线 ch4_conclusion 不应被早期桥覆盖，实际：${text}`);

if (errors.length) {
  console.error('Early ending continuity smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Early ending continuity smoke passed.');
