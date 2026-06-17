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

function clues(names) {
  return names.map(name => ({ name, desc: '' }));
}

reset({
  flags: {},
  clues: clues([
    '陈明远坠楼案',
    '陈明远的信',
    '恐吓信',
    '傅启元夜运教具箱'
  ]),
  items: []
});
assert(E.canDeduce('deduce_chen'), `陈明远之死应能用死亡疑点/陈信/威胁/光华异常打开，缺 ${E.deductionMissingFor('deduce_chen')?.join('、')}`);

reset({
  flags: { deduced_chen: true },
  clues: clues([
    '黑衣男人线索',
    '203 室的陆姓女子',
    '陆念薇旧名',
    '沈玉芳请假失踪'
  ]),
  items: []
});
assert(E.canDeduce('deduce_lu_zhao'), `第二段推理应接受等价线索：203 室陆姓女子/陆念薇旧名/沈玉芳请假失踪，缺 ${E.deductionMissingFor('deduce_lu_zhao')?.join('、')}`);

reset({
  flags: { deduced_chen: true },
  clues: clues([
    '跟踪黑衣男人',
    '陆小姐的笔记',
    '翡翠镯',
    '苏晚亭日记残页'
  ]),
  items: []
});
assert(E.canDeduce('deduce_lu_zhao'), `第二段推理应接受跟踪/陆小姐笔记/翡翠镯/苏晚亭日记残页组合，缺 ${E.deductionMissingFor('deduce_lu_zhao')?.join('、')}`);

reset({
  flags: { deduced_chen: true },
  clues: clues([
    '跟踪黑衣男人',
    '陆小姐的笔记',
    '翡翠镯'
  ]),
  items: []
});
assert(!E.canDeduce('deduce_lu_zhao'), '第二段缺少沈玉芳或苏晚亭卷入线索时仍应锁住');
assert(E.deductionMissingFor('deduce_lu_zhao')?.includes('沈玉芳或苏晚亭卷入陆小姐线索'), '第二段缺失提示应指向沈玉芳或苏晚亭卷入线索');

reset({
  flags: { deduced_chen: true, deduced_lu_zhao: true },
  clues: clues([
    '王巡官遗留纸条',
    '陈明远的信',
    '恐吓信',
    '清场指令',
    '光华货运单'
  ]),
  items: []
});
assert(E.canDeduce('deduce_fusheng'), `第三段推理应接受王纸条/陈信/恐吓/清场/货运单，缺 ${E.deductionMissingFor('deduce_fusheng')?.join('、')}`);

reset({
  flags: { deduced_chen: true, deduced_lu_zhao: true },
  clues: clues([
    '福生仓标识',
    '陈明远的退缩',
    '203 室恐吓信',
    '福生仓清场',
    '管制药品走私'
  ]),
  items: []
});
assert(E.canDeduce('deduce_fusheng'), `第三段推理应接受等价现场证据组合，缺 ${E.deductionMissingFor('deduce_fusheng')?.join('、')}`);

reset({
  flags: { deduced_chen: true, deduced_lu_zhao: true },
  clues: clues([
    '王巡官遗留纸条',
    '陈明远的信',
    '恐吓信',
    '傅启元夜运教具箱'
  ]),
  items: []
});
assert(!E.canDeduce('deduce_fusheng'), '第三段没有福生仓现场公董局清场证据时应锁住');
assert(E.deductionMissingFor('deduce_fusheng')?.includes('福生仓现场公董局清场证据'), '第三段缺失提示应指向福生仓现场公董局清场证据');

if (errors.length) {
  console.error('Deduction prerequisite groups smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Deduction prerequisite groups smoke passed.');
