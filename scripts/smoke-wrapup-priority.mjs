#!/usr/bin/env node
import { loadStoryRuntime } from './story-harness.mjs';

const h = loadStoryRuntime();
const { E } = h;
const errors = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function reset(overrides = {}) {
  h.resetState(overrides);
}

function choiceTexts(sceneId) {
  h.renderNode(sceneId);
  return h.choicesOf(sceneId).map(choice => choice.text || choice.fogText || '');
}

function has(texts, fragment) {
  return texts.some(text => text.includes(fragment));
}

function notHas(texts, fragment) {
  return !has(texts, fragment);
}

const richPreDeductionClues = [
  '陈明远坠楼案',
  '恐吓信',
  '陆小姐的笔记',
  '陈明远的信',
  '王巡官遗留纸条',
  '三人合影',
  '福生仓标识',
  '光华小学证据闭环',
].map(name => ({ name, desc: '' }));

reset({
  clues: richPreDeductionClues,
  flags: { school_wu_three_proofs: true },
});
let texts = choiceTexts('ch3_wrapup');
assert(has(texts, '下一步：拼合线索——推理陈明远之死'), '未推陈明远之死时，应只突出第一段推理');
assert(notHas(texts, '去当铺'), '未完成第一段推理时，不应同时显示当铺入口');
assert(notHas(texts, '找老孙'), '未完成第一段推理时，不应同时显示老孙入口');
assert(notHas(texts, '苏州河废弃码头'), '未完成第一段推理时，不应同时显示码头入口');

reset({
  clues: richPreDeductionClues,
  flags: { school_wu_three_proofs: true, deduced_chen: true },
});
texts = choiceTexts('ch3_wrapup');
assert(has(texts, '下一步：去当铺——查当票上的翡翠镯'), '完成第一段推理后，应引导去当铺');
assert(notHas(texts, '苏州河废弃码头'), '拿翡翠镯前，不应提前显示码头入口');

reset({
  clues: [...richPreDeductionClues, { name: '翡翠镯', desc: '' }, { name: '跟踪黑衣男人', desc: '' }, { name: '神秘女子', desc: '' }, { name: '沈玉兰的妹妹', desc: '' }],
  items: [{ name: '翡翠镯', desc: '' }],
  flags: { school_wu_three_proofs: true, deduced_chen: true },
});
texts = choiceTexts('ch3_wrapup');
assert(has(texts, '下一步：推理黑衣男人与陆小姐的关系'), '拿到翡翠镯且条件齐后，应引导第二段推理');
assert(notHas(texts, '苏州河废弃码头'), '第二段推理前，不应提前显示码头入口');

reset({
  clues: [...richPreDeductionClues, { name: '翡翠镯', desc: '' }, { name: '跟踪黑衣男人', desc: '' }, { name: '神秘女子', desc: '' }, { name: '沈玉兰的妹妹', desc: '' }],
  items: [{ name: '翡翠镯', desc: '' }],
  flags: { school_wu_three_proofs: true, deduced_chen: true, deduced_lu_zhao: true },
});
texts = choiceTexts('ch3_wrapup');
assert(has(texts, '下一步：不找支援，独自去福生仓'), '完成第二段推理且未找老孙时，应显示 solo 福生仓入口');
assert(has(texts, '下一步：去巡捕房找老孙商量福生仓'), '完成第二段推理且未找老孙时，应同时显示老孙支援入口');
assert(has(texts, '回顾现有证据'), '行动选择阶段仍应保留回顾入口');

if (errors.length) {
  console.error('Wrapup priority smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Wrapup priority smoke passed.');
