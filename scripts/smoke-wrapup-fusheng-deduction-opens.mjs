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
  return rt.choicesOf(id);
}

reset({
  flags: {
    deduced_chen: true,
    deduced_lu_zhao: true,
    sun_fast_support: true,
    sun_support_available: true,
    missed_both_at_dock: true,
    missed_both_due_to_return_tool: true,
  },
  clues: [
    { name: '王巡官遗留纸条', desc: '' },
    { name: '陈明远的信', desc: '' },
    { name: '恐吓信', desc: '' },
    { name: '公董局公文纸', desc: '' },
    { name: '暗室刚被清空', desc: '' },
    { name: '教具箱走私', desc: '' },
    { name: '沈玉芳曾在暗室', desc: '' },
    { name: '苏晚亭曾在暗室', desc: '' },
  ],
  items: [
    { name: '光华货运单', desc: '' },
    { name: '苏晚亭学生证', desc: '' },
    { name: '沈玉芳半截粉笔', desc: '' },
  ],
});

const opts = choices('ch3_wrapup');
const fusheng = opts.find(choice => (choice.text || choice.fogText || '').includes('福生仓与公董局'));
assert(fusheng, '空暗室证据到手后，线索整理页应出现福生仓推理入口');
assert(!fusheng.when || fusheng.when(E.state), '福生仓推理入口不应是锁定状态');
assert(typeof fusheng.effect === 'function', '福生仓推理入口必须带 effect 打开推理面板');
assert(!fusheng.goto, '福生仓推理入口不应只有 goto，否则会跳转/无响应');
assert(E.canDeduce('deduce_fusheng'), '空暗室证据链应满足福生仓推理条件');

let requestedDeduction = null;
const originalOpenDeduction = typeof E.openDeduction === 'function' ? E.openDeduction.bind(E) : null;
const originalOpenDeductionSafe = typeof E.openDeductionSafe === 'function' ? E.openDeductionSafe.bind(E) : null;

if (originalOpenDeduction) {
  E.openDeduction = function (id) {
    requestedDeduction = id;
    return originalOpenDeduction(id);
  };
}

if (originalOpenDeductionSafe) {
  E.openDeductionSafe = function (id) {
    requestedDeduction = id;
    return originalOpenDeductionSafe(id);
  };
}

if (typeof fusheng.effect === 'function') fusheng.effect(E.state);
assert(requestedDeduction === 'deduce_fusheng', '点击后应确实请求打开 deduce_fusheng 推理题');
assert(
  requestedDeduction === 'deduce_fusheng' || E.deducEl?.style?.display === 'flex' || E.lastOpenedDeduction === 'deduce_fusheng',
  '点击福生仓推理入口后应打开推理面板'
);

if (errors.length) {
  console.error('Wrapup fusheng deduction smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Wrapup fusheng deduction smoke passed.');
