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

function textOf(id) {
  rt.renderNode(id);
  const node = rt.nodes[id];
  return typeof node.text === 'function' ? String(node.text(E.state)) : String(node.text || '');
}

function hasChoice(list, fragment, goto) {
  return list.some(choice => choice.text.includes(fragment) && (!goto || choice.goto === goto));
}

function assertNoSpoilerNames(text, label) {
  for (const word of ['傅启元', '福生仓', '公董局']) {
    assert(!text.includes(word), `${label} 不应提前点名 ${word}，实际：${text}`);
  }
}

// 前期缺关键前置时，光华小学应允许表层结案，但提示必须是叙事内语言，不是开发者缺证清单，也不能剧透后续专名。
reset({
  flags: {
    asked_about_chen: true,
    got_chen_evidence: true,
    read_letter: true,
    presented_photo_to_wu: true,
  },
  items: [
    { name: '三人合影', desc: '' },
    { name: '陈明远的信', desc: '' },
  ],
  clues: [
    { name: '三人合影', desc: '' },
    { name: '陈明远的信', desc: '' },
  ],
});
let text = textOf('ch3_school_confront_wu');
assert(text.includes('话还没有压到底'), `缺证时吴校长质询页应使用叙事阻滞提示，实际：${text}`);
assert(text.includes('陈明远死前究竟被谁逼到墙角') && text.includes('苏晚亭到底是主动追查'), `缺证提示应写成叙事空白，实际：${text}`);
assert(text.includes('学校背后的那层关系'), `缺证提示应使用非剧透表达，实际：${text}`);
assert(!text.includes('你还缺：'), `缺证提示不应出现开发者清单“你还缺”，实际：${text}`);
assert(!text.includes('203 室恐吓信') && !text.includes('苏晚亭大学日记残页'), `缺证提示不应直接列道具名，实际：${text}`);
assertNoSpoilerNames(text, '缺证提示');
let list = choices('ch3_school_confront_wu');
assert(hasChoice(list, '接受这个较容易成立的说法', 'ch3_school_incomplete_closure'), `缺证时应提供叙事化表层结案入口，实际 ${JSON.stringify(list)}`);

// 表层结案节点应落到旧证据不足收束。
text = textOf('ch3_school_incomplete_closure');
assert(text.includes('不完整的答案'), `表层结案节点应说明答案不完整，实际：${text}`);
assert(text.includes('太容易被接受的答案'), `表层结案节点应强调这是表层答案，实际：${text}`);
assert(!text.includes('你还缺：'), `表层结案节点不应出现开发者清单，实际：${text}`);
assertNoSpoilerNames(text, '表层结案节点');
list = choices('ch3_school_incomplete_closure');
assert(hasChoice(list, '接受这个较容易成立的说法', 'ch4_conclusion'), `表层结案应回到结案整理，实际 ${JSON.stringify(list)}`);

if (typeof rt.nodes.ch3_school_incomplete_closure.effect === 'function') rt.nodes.ch3_school_incomplete_closure.effect(E.state);
assert(E.getFlag('school_incomplete_closure'), '表层结案应设置 school_incomplete_closure');
assert(E.hasClue('光华小学不完整结论'), '表层结案应加入不完整结论线索');

text = textOf('ch3_wrapup');
assert(text.includes('光华小学线索只到表层'), `表层结案后 wrapup 应提示只到表层，实际：${text}`);
assertNoSpoilerNames(text, '表层结案后的整理页提示');

// 三证齐全时，不应显示表层结案入口。
reset({
  flags: {
    asked_about_chen: true,
    got_chen_evidence: true,
    read_letter: true,
    presented_threat_to_wu: true,
    presented_photo_to_wu: true,
    presented_university_to_wu: true,
    school_wu_three_proofs: true,
  },
  items: [
    { name: '恐吓信', desc: '' },
    { name: '三人合影', desc: '' },
    { name: '日记残页', desc: '' },
  ],
  clues: [
    { name: '恐吓信', desc: '' },
    { name: '三人合影', desc: '' },
    { name: '苏晚亭日记残页', desc: '' },
  ],
});
list = choices('ch3_school_confront_wu');
assert(!hasChoice(list, '接受这个较容易成立的说法', 'ch3_school_incomplete_closure'), `三证齐全时不应提供表层结案入口，实际 ${JSON.stringify(list)}`);

if (errors.length) {
  console.error('Guanghua incomplete closure smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Guanghua incomplete closure smoke passed.');
