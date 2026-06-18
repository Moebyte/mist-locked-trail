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
    effect: choice.effect,
  }));
}

function textOf(id) {
  rt.renderNode(id);
  const node = rt.nodes[id];
  return typeof node.text === 'function' ? String(node.text(E.state)) : String(node.text || '');
}

function assertValidChoiceTargets(sceneId, list) {
  for (const choice of list) {
    if (!choice.goto) continue;
    assert(rt.nodes[choice.goto], `${sceneId} 选项「${choice.text}」指向不存在节点 ${choice.goto}`);
  }
}

for (const id of [
  'ch4_zhou_present_jade',
  'ch4_zhou_present_jade_premature',
  'ch4_zhou_present_chen_letter',
  'ch4_zhou_present_su_last_letter',
  'ch4_zhou_present_wang_note',
  'ch4_zhou_present_threat'
]) {
  assert(rt.nodes[id], `必须存在 ${id} 节点`);
}

// 完整/可继续福生仓路线：周怀安连续举证面板里的每一个选项都必须能跳到存在节点。
reset({
  flags: {
    shown_map_to_landlord: true,
    got_wang_note: true,
    deduced_chen: true,
  },
  items: [
    { name: '翡翠镯', desc: '' },
    { name: '半张烟盒纸', desc: '' },
    { name: '陈明远的信', desc: '' },
    { name: '恐吓信', desc: '' },
  ],
  clues: [
    { name: '法租界地图', desc: '' },
    { name: '福生仓标识', desc: '' },
    { name: '王巡官遗留纸条', desc: '' },
  ],
});
let list = choices('ch4_revisit_zhou');
assertValidChoiceTargets('ch4_revisit_zhou/full', list);
for (const fragment of ['翡翠镯', '陈明远', '半张烟盒纸', '恐吓信']) {
  const choice = list.find(choice => choice.text.includes(fragment));
  assert(choice, `完整路线周怀安面板应显示「${fragment}」选项，实际 ${JSON.stringify(list)}`);
  if (!choice) continue;
  assert(rt.nodes[choice.goto], `完整路线「${fragment}」目标节点必须存在：${choice.goto}`);
  if (typeof choice.effect === 'function') choice.effect(E.state);
  const text = textOf(choice.goto);
  assert(text.length > 20, `完整路线「${fragment}」目标节点应有正文：${choice.goto}`);
  assertValidChoiceTargets(choice.goto, choices(choice.goto));
  // 重新回到同一初始状态，避免前一轮 effect 隐藏后续选项。
  reset({
    flags: { shown_map_to_landlord: true, got_wang_note: true, deduced_chen: true },
    items: [
      { name: '翡翠镯', desc: '' },
      { name: '半张烟盒纸', desc: '' },
      { name: '陈明远的信', desc: '' },
      { name: '恐吓信', desc: '' },
    ],
    clues: [
      { name: '法租界地图', desc: '' },
      { name: '福生仓标识', desc: '' },
      { name: '王巡官遗留纸条', desc: '' },
    ],
  });
  list = choices('ch4_revisit_zhou');
}

// 翡翠镯完整路线目标必须是正常节点。
let jade = list.find(choice => choice.text.includes('翡翠镯'));
assert(jade?.goto === 'ch4_zhou_present_jade', `完整路线翡翠镯应跳正常节点，实际 ${jade?.goto}`);
if (jade) {
  jade.effect?.(E.state);
  const normalText = textOf(jade.goto);
  assert(normalText.includes('陆念'), `正常翡翠镯举证应提到陆念，实际：${normalText}`);
  assert(E.getFlag('presented_jade_to_zhou'), '正常翡翠镯举证应设置 presented_jade_to_zhou');
}

// 早期坏路线/前置不足：出示翡翠镯应进入 premature 节点，也不应场景丢失。
reset({
  flags: {
    deduced_chen: true,
  },
  items: [
    { name: '翡翠镯', desc: '' },
  ],
  clues: [
    { name: '法租界地图', desc: '' },
  ],
});
list = choices('ch4_revisit_zhou');
assertValidChoiceTargets('ch4_revisit_zhou/premature', list);
jade = list.find(choice => choice.text.includes('翡翠镯'));
assert(jade, `早期路线回访周怀安应显示翡翠镯选项，实际 ${JSON.stringify(list)}`);
const prematureTarget = jade?.goto;
assert(prematureTarget === 'ch4_zhou_present_jade_premature', `早期路线翡翠镯应跳 premature 节点，实际 ${prematureTarget}`);
if (jade) {
  jade.effect?.(E.state);
  const prematureText = textOf(prematureTarget);
  assert(prematureText.includes('我要知道晚亭在哪里'), `早期翡翠镯举证应说明它回答不了苏晚亭去向，实际：${prematureText}`);
  assert(E.getFlag('presented_jade_to_zhou_premature'), '早期翡翠镯举证应设置 presented_jade_to_zhou_premature');
  assertValidChoiceTargets(prematureTarget, choices(prematureTarget));
}

if (errors.length) {
  console.error('Zhou evidence present node smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Zhou evidence present node smoke passed.');
