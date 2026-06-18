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

// 节点必须存在，避免点击回访周怀安的翡翠镯选项后场景丢失。
assert(rt.nodes.ch4_zhou_present_jade, '必须存在 ch4_zhou_present_jade 节点');
assert(rt.nodes.ch4_zhou_present_jade_premature, '必须存在 ch4_zhou_present_jade_premature 节点');

// 完整/可继续福生仓路线：出示翡翠镯应进入正常举证节点，不应场景丢失。
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
  ],
  clues: [
    { name: '法租界地图', desc: '' },
    { name: '福生仓标识', desc: '' },
    { name: '王巡官遗留纸条', desc: '' },
  ],
});
let list = choices('ch4_revisit_zhou');
let jade = list.find(choice => choice.text.includes('翡翠镯'));
assert(jade, `回访周怀安应显示翡翠镯选项，实际 ${JSON.stringify(list)}`);
const normalTarget = jade.goto;
assert(normalTarget === 'ch4_zhou_present_jade', `完整路线翡翠镯应跳正常节点，实际 ${normalTarget}`);
assert(rt.nodes[normalTarget], `目标节点必须存在：${normalTarget}`);
if (typeof jade.effect === 'function') jade.effect(E.state);
const normalText = textOf(normalTarget);
assert(normalText.includes('陆念'), `正常翡翠镯举证应提到陆念，实际：${normalText}`);
assert(E.getFlag('presented_jade_to_zhou'), '正常翡翠镯举证应设置 presented_jade_to_zhou');
list = choices(normalTarget);
assert(list.some(choice => choice.goto === 'ch4_revisit_zhou') || list.some(choice => choice.goto === 'ch3_wrapup'), `正常翡翠镯后应有有效返回/继续选项，实际 ${JSON.stringify(list)}`);

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
jade = list.find(choice => choice.text.includes('翡翠镯'));
assert(jade, `早期路线回访周怀安应显示翡翠镯选项，实际 ${JSON.stringify(list)}`);
const prematureTarget = jade.goto;
assert(prematureTarget === 'ch4_zhou_present_jade_premature', `早期路线翡翠镯应跳 premature 节点，实际 ${prematureTarget}`);
assert(rt.nodes[prematureTarget], `目标节点必须存在：${prematureTarget}`);
if (typeof jade.effect === 'function') jade.effect(E.state);
const prematureText = textOf(prematureTarget);
assert(prematureText.includes('我要知道晚亭在哪里'), `早期翡翠镯举证应说明它回答不了苏晚亭去向，实际：${prematureText}`);
assert(E.getFlag('presented_jade_to_zhou_premature'), '早期翡翠镯举证应设置 presented_jade_to_zhou_premature');
list = choices(prematureTarget);
assert(list.some(choice => choice.goto === 'ch3_wrapup'), `早期翡翠镯后应能回到线索整理，实际 ${JSON.stringify(list)}`);

if (errors.length) {
  console.error('Zhou jade present node smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Zhou jade present node smoke passed.');
