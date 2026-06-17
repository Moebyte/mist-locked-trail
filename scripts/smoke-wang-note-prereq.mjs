#!/usr/bin/env node
import { loadStoryRuntime } from './story-harness.mjs';

const rt = loadStoryRuntime();
const errors = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function reset(overrides = {}) {
  rt.resetState(overrides);
}

function choiceTexts(id) {
  return rt.choicesOf(id).map(choice => choice.text || choice.fogText || '');
}

function hasChoice(id, fragment) {
  return choiceTexts(id).some(text => text.includes(fragment));
}

reset({ clues: [{ name: '法租界地图', desc: '' }], items: [{ name: '法租界地图', desc: '' }] });
assert(hasChoice('ch2_police_file', '王巡官纸条线索未浮出'), '没有老头认出福生仓时，应提示王巡官纸条线索未浮出');
assert(!hasChoice('ch2_police_file', '追问王巡官调离前留下的仓库线索'), '没有福生仓标记前，不应允许追问王纸条');

const blocked = rt.renderNode('ch2_police_wang');
const blockedText = typeof blocked.text === 'function' ? blocked.text(rt.E.state) : blocked.text;
assert(blockedText.includes('先把薛华立路那张地图上的标记查清楚'), '强行进王巡官节点时，应要求先查地图标记');
blocked.effect?.(rt.E.state);
assert(!rt.E.getFlag('got_wang_note'), '缺少福生仓标记时，不应设置 got_wang_note');
assert(!rt.E.hasItem('半张烟盒纸'), '缺少福生仓标记时，不应获得半张烟盒纸');

reset({
  flags: { shown_map_to_landlord: true },
  clues: [{ name: '法租界地图', desc: '' }, { name: '福生仓标识', desc: '' }],
  items: [{ name: '法租界地图', desc: '' }],
});
assert(hasChoice('ch2_police_file', '追问王巡官调离前留下的仓库线索'), '老头认出福生仓后，应允许追问王纸条');
const wang = rt.renderNode('ch2_police_wang');
const wangText = typeof wang.text === 'function' ? wang.text(rt.E.state) : wang.text;
assert(wangText.includes('福生仓。三日清。'), '满足前置后，王巡官节点应给出福生仓纸条内容');
wang.effect?.(rt.E.state);
assert(rt.E.getFlag('got_wang_note'), '满足前置后，应设置 got_wang_note');
assert(rt.E.hasItem('半张烟盒纸'), '满足前置后，应获得半张烟盒纸');

if (errors.length) {
  console.error('Wang note prerequisite smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Wang note prerequisite smoke passed.');
