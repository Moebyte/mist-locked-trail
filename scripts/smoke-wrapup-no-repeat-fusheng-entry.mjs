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

const commonState = {
  flags: {
    deduced_chen: true,
    deduced_lu_zhao: true,
    dock_force_solo_entry: true,
    dock_solo_entry_requested: true,
    dock_entry_committed: true,
    dock_solo_entry: true,
  },
  clues: [
    { name: '王巡官遗留纸条', desc: '' },
    { name: '陈明远的信', desc: '' },
    { name: '恐吓信', desc: '' },
    { name: '翡翠镯', desc: '' },
  ],
  items: [
    { name: '翡翠镯', desc: '' },
  ],
};

reset({
  ...commonState,
  flags: {
    ...commonState.flags,
    found_yufang: true,
    su_moved_from_dock: true,
  },
  clues: [
    ...commonState.clues,
    { name: '仓库暗室', desc: '' },
    { name: '获救者身份', desc: '' },
    { name: '苏晚亭曾在暗室', desc: '' },
  ],
  items: [
    ...commonState.items,
    { name: '苏晚亭学生证', desc: '' },
  ],
});
let texts = choiceTexts('ch3_wrapup');
assert(notHas(texts, '不找支援，独自去福生仓'), 'solo 到过暗室后，不应再次显示 solo 福生仓入口');
assert(notHas(texts, '巡捕房找老孙商量福生仓'), 'solo 到过暗室后，不应再次显示老孙支援入口');
assert(notHas(texts, '苏州河废弃码头'), 'solo 到过暗室后，不应再次显示码头入口');
assert(has(texts, '回顾现有证据') || has(texts, '福生仓与公董局'), 'solo 到过暗室后，应进入整理/第三段推理/收束阶段');

reset({
  ...commonState,
  flags: {
    ...commonState.flags,
    missed_both_at_dock: true,
    missed_both_due_to_return_tool: true,
    su_moved_from_dock: true,
    yufang_moved_from_dock: true,
  },
  clues: [
    ...commonState.clues,
    { name: '暗室刚被清空', desc: '' },
    { name: '沈玉芳曾在暗室', desc: '' },
    { name: '苏晚亭曾在暗室', desc: '' },
    { name: '教具箱走私', desc: '' },
    { name: '公董局公文纸', desc: '' },
  ],
  items: [
    ...commonState.items,
    { name: '光华货运单', desc: '' },
    { name: '苏晚亭学生证', desc: '' },
  ],
});
texts = choiceTexts('ch3_wrapup');
assert(notHas(texts, '不找支援，独自去福生仓'), '空暗室返回整理页后，不应再次显示 solo 福生仓入口');
assert(notHas(texts, '巡捕房找老孙商量福生仓'), '空暗室返回整理页后，不应再次显示老孙支援入口');
assert(has(texts, '福生仓与公董局') || has(texts, '回顾现有证据'), '空暗室返回整理页后，应进入第三段推理或收束阶段');

if (errors.length) {
  console.error('Wrapup no-repeat Fusheng entry smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Wrapup no-repeat Fusheng entry smoke passed.');
