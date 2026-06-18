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

function choices(sceneId) {
  h.renderNode(sceneId);
  return h.choicesOf(sceneId).map(choice => ({
    text: choice.text || choice.fogText || '',
    goto: typeof choice.goto === 'function' ? choice.goto(E.state) : choice.goto,
    hasEffect: typeof choice.effect === 'function',
  }));
}

function choiceTexts(sceneId) {
  return choices(sceneId).map(choice => choice.text);
}

function has(texts, fragment) {
  return texts.some(text => text.includes(fragment));
}

function notHas(texts, fragment) {
  return !has(texts, fragment);
}

function hasGoto(list, target) {
  return list.some(choice => choice.goto === target);
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
let list = choices('ch3_wrapup');
let texts = list.map(choice => choice.text);
assert(notHas(texts, '不找支援，独自去福生仓'), 'solo 到过暗室后，不应再次显示 solo 福生仓入口');
assert(notHas(texts, '巡捕房找老孙商量福生仓'), 'solo 到过暗室后，不应再次显示老孙支援入口');
assert(notHas(texts, '苏州河废弃码头'), 'solo 到过暗室后，不应再次显示码头入口');
assert(hasGoto(list, 'ch4_hospital_conflict') || has(texts, '医院') || has(texts, '撤离') || has(texts, '逃离'), `solo 到过暗室但医院未处理时，应进入撤离/医院阶段，实际 ${JSON.stringify(list)}`);

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
list = choices('ch3_wrapup');
texts = list.map(choice => choice.text);
assert(notHas(texts, '不找支援，独自去福生仓'), '空暗室返回整理页后，不应再次显示 solo 福生仓入口');
assert(notHas(texts, '巡捕房找老孙商量福生仓'), '空暗室返回整理页后，不应再次显示老孙支援入口');
assert(has(texts, '福生仓与公董局') || has(texts, '回顾现有证据'), `空暗室返回整理页后，应进入第三段推理或物证整理阶段，实际 ${JSON.stringify(list)}`);

if (errors.length) {
  console.error('Wrapup no-repeat Fusheng entry smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Wrapup no-repeat Fusheng entry passed.');