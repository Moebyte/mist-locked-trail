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

function hasChoice(list, fragment, goto) {
  return list.some(choice => choice.text.includes(fragment) && (!goto || choice.goto === goto));
}

// 前期证据齐、第一段和第二段推理完成后，必须能进入福生仓行动。
reset({
  flags: {
    deduced_chen: true,
    deduced_lu_zhao: true,
    got_wang_note: true,
    shown_map_to_landlord: true,
  },
  clues: [
    { name: '法租界地图', desc: '' },
    { name: '铅笔清单', desc: '' },
    { name: '福生仓标识', desc: '' },
    { name: '王巡官遗留纸条', desc: '' },
    { name: '陈明远的信', desc: '' },
    { name: '傅启元夜运教具箱', desc: '' },
    { name: '管制药品走私', desc: '' },
  ],
  items: [
    { name: '法租界地图', desc: '' },
    { name: '铅笔清单', desc: '' },
    { name: '半张烟盒纸', desc: '' },
    { name: '翡翠镯', desc: '' },
  ],
});
let list = choices('ch3_wrapup');
assert(hasChoice(list, '独自去福生仓', 'ch4_suzhou_creek'), `ch3_wrapup 应显示 solo 福生仓入口，实际 ${JSON.stringify(list)}`);
assert(hasChoice(list, '找老孙商量福生仓', 'ch4_sun_support'), `ch3_wrapup 应显示老孙福生仓入口，实际 ${JSON.stringify(list)}`);

// 即使早期收束层曾把结论页改成证据不足，结论页也必须能退回行动入口。
list = choices('ch4_conclusion');
assert(hasChoice(list, '独自去福生仓', 'ch4_suzhou_creek'), `ch4_conclusion 应恢复 solo 福生仓入口，实际 ${JSON.stringify(list)}`);
assert(hasChoice(list, '找老孙商量福生仓', 'ch4_sun_support'), `ch4_conclusion 应恢复老孙福生仓入口，实际 ${JSON.stringify(list)}`);

// 兼容用户实际反馈：即使某个早期前置名字没被旧 bad-route 识别，只要前两段推理已完成，也不能堵死福生仓入口。
reset({
  flags: {
    deduced_chen: true,
    deduced_lu_zhao: true,
  },
  clues: [
    { name: '陈明远的信', desc: '' },
    { name: '傅启元夜运教具箱', desc: '' },
    { name: '管制药品走私', desc: '' },
  ],
  items: [
    { name: '翡翠镯', desc: '' },
  ],
});
list = choices('ch3_wrapup');
assert(hasChoice(list, '独自去福生仓', 'ch4_suzhou_creek'), `前两段推理完成后，即使旧前置识别缺项，也应有 solo 入口，实际 ${JSON.stringify(list)}`);
assert(hasChoice(list, '找老孙商量福生仓', 'ch4_sun_support'), `前两段推理完成后，即使旧前置识别缺项，也应有老孙入口，实际 ${JSON.stringify(list)}`);

// 已经进入过福生仓后，不应重复显示入口。
reset({
  flags: {
    deduced_chen: true,
    deduced_lu_zhao: true,
    dock_entry_committed: true,
  },
  clues: [{ name: '仓库暗室', desc: '' }],
});
list = choices('ch3_wrapup');
assert(!hasChoice(list, '独自去福生仓', 'ch4_suzhou_creek'), `已进入福生仓后不应重复显示 solo 入口，实际 ${JSON.stringify(list)}`);
assert(!hasChoice(list, '找老孙商量福生仓', 'ch4_sun_support'), `已进入福生仓后不应重复显示老孙入口，实际 ${JSON.stringify(list)}`);

if (errors.length) {
  console.error('Fusheng entry unblock smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Fusheng entry unblock smoke passed.');
