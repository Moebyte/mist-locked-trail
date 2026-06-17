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
assert(hasChoice('ch2_police_file', '这行铅笔字暂时问不下去'), '缺少具体地点线索时，应以迷雾形式提示铅笔字暂时问不下去');
assert(!hasChoice('ch2_police_file', '王巡官纸条线索未浮出'), '锁定提示不应出现旧版答案式文案');
assert(!hasChoice('ch2_police_file', '福生仓'), '锁定提示不应提前出现仓库名');
assert(!hasChoice('ch2_police_file', '追问王巡官调离前留下的仓库线索'), '缺少仓库标记前，不应允许追问仓库线索');

const blocked = rt.renderNode('ch2_police_wang');
const blockedText = typeof blocked.text === 'function' ? blocked.text(rt.E.state) : blocked.text;
assert(blockedText.includes('先把地图上那个被圈出的地方查清楚'), '前置不足时，应要求先查地图标记');
assert(!blockedText.includes('福生仓'), '前置不足文本不应提前出现仓库名');
assert(!blockedText.includes('王巡官留下了什么'), '前置不足文本不应提前说明后续物件');
blocked.effect?.(rt.E.state);
assert(!rt.E.getFlag('got_wang_note'), '前置不足时，不应设置 got_wang_note');
assert(!rt.E.hasItem('半张烟盒纸'), '前置不足时，不应获得半张烟盒纸');

reset({
  flags: { shown_map_to_landlord: true },
  clues: [{ name: '法租界地图', desc: '' }, { name: '福生仓标识', desc: '' }],
  items: [{ name: '法租界地图', desc: '' }],
});
assert(hasChoice('ch2_police_file', '追问王巡官调离前留下的仓库线索'), '老头认出仓库后，应允许追问仓库线索');
const wang = rt.renderNode('ch2_police_wang');
const wangText = typeof wang.text === 'function' ? wang.text(rt.E.state) : wang.text;
assert(wangText.includes('福生仓。三日清。'), '满足前置后，王巡官节点应给出纸条内容');
wang.effect?.(rt.E.state);
assert(rt.E.getFlag('got_wang_note'), '满足前置后，应设置 got_wang_note');
assert(rt.E.hasItem('半张烟盒纸'), '满足前置后，应获得半张烟盒纸');

if (errors.length) {
  console.error('Wang note prerequisite smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Wang note prerequisite smoke passed.');
