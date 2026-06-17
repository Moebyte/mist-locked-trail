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

function texts(id) {
  return rt.choicesOf(id).map(choice => choice.text || choice.fogText || '');
}

function has(id, fragment) {
  return texts(id).some(text => text.includes(fragment));
}

const homeDone = { asked_photo: true, asked_mother_photo: true };

reset({
  flags: { ...homeDone, got_case_file: true },
  clues: [{ name: '母亲证词', desc: '' }, { name: '光华小学事件', desc: '' }],
  items: [{ name: '卷宗摘抄', desc: '' }],
});
assert(has('ch2_leave_home', '回圣约翰大学'), '先巡捕房再苏家后，缺大学线时应自然引导回大学');
assert(has('ch2_leave_home', '晚亭失踪前的线索'), '大学回流文案应是叙事口吻');
assert(!has('ch2_leave_home', '补齐薛华立路来源'), '大学回流文案不应使用路线依赖式表达');
assert(!has('ch2_leave_home', '薛华立路'), '缺大学线时，苏家出来不应直接去薛华立路');

reset({
  flags: { ...homeDone, got_case_file: true },
  clues: [
    { name: '母亲证词', desc: '' },
    { name: '光华小学事件', desc: '' },
    { name: '舍监证词', desc: '' },
    { name: '法租界地图', desc: '' },
  ],
  items: [{ name: '卷宗摘抄', desc: '' }, { name: '法租界地图', desc: '' }],
});
assert(has('ch2_leave_home', '薛华立路'), '大学与巡捕房都查过后，苏家出来应能回薛华立路推进');
assert(!has('ch2_leave_home', '光华小学'), '拿王纸条前，苏家出来不应直接跳光华小学');

reset({
  flags: { ...homeDone, got_case_file: true, shown_map_to_landlord: true },
  clues: [
    { name: '母亲证词', desc: '' },
    { name: '光华小学事件', desc: '' },
    { name: '舍监证词', desc: '' },
    { name: '法租界地图', desc: '' },
    { name: '福生仓标识', desc: '' },
    { name: '三人合影', desc: '' },
  ],
  items: [{ name: '卷宗摘抄', desc: '' }, { name: '法租界地图', desc: '' }, { name: '三人合影', desc: '' }],
});
assert(has('ch2_leave_home', '回巡捕房'), '查出仓库标记但未拿王纸条时，苏家出来必须能回巡捕房');
assert(!has('ch2_leave_home', '去光华小学'), '查出仓库标记但未拿王纸条时，苏家出来不应直接去光华小学');

reset({
  flags: { ...homeDone, got_case_file: true, shown_map_to_landlord: true, got_wang_note: true },
  clues: [
    { name: '母亲证词', desc: '' },
    { name: '光华小学事件', desc: '' },
    { name: '舍监证词', desc: '' },
    { name: '法租界地图', desc: '' },
    { name: '福生仓标识', desc: '' },
    { name: '王巡官遗留纸条', desc: '' },
  ],
  items: [{ name: '卷宗摘抄', desc: '' }, { name: '法租界地图', desc: '' }, { name: '半张烟盒纸', desc: '' }],
});
assert(has('ch2_leave_home', '光华小学'), '拿到王纸条后，苏家出来应引导去光华小学');
assert(!has('ch2_leave_home', '回巡捕房'), '拿到王纸条后，苏家出来不应继续卡巡捕房');

reset({ flags: { echo_yulan_promise: true } });
assert(has('ch2_yulan_promise_echo', '回永兴贸易商行'), '沈玉兰托付后，应先回永兴贸易商行继续查');
assert(!has('ch2_yulan_promise_echo', '光华小学'), '拿王纸条前，沈玉兰托付后不应直接跳光华小学');

reset({ flags: { echo_yulan_promise: true, got_wang_note: true }, clues: [{ name: '王巡官遗留纸条', desc: '' }], items: [{ name: '半张烟盒纸', desc: '' }] });
assert(has('ch2_yulan_promise_echo', '光华小学'), '拿到王纸条后，沈玉兰托付节点才恢复光华小学入口');

if (errors.length) {
  console.error('Home route polish smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Home route polish smoke passed.');
