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

function hasOldReturn22(id) {
  return texts(id).some(text => text.includes('回薛华立路 22 号') || text.includes('回去搜 22 号') || text.includes('先回去搜 22 号'));
}

reset();
assert(has('ch2_frenchtown', '先在周围观察'), '薛华立路初到时应显示周围观察');
assert(has('ch2_frenchtown', '问看门老头关于陆姓女子'), '薛华立路初到时应显示问看门老头');
assert(!has('ch2_frenchtown', '上二楼，敲 203'), '未问看门老头前不应直接上203');

reset({ flags: { saw_man: true } });
assert(!has('ch2_frenchtown', '先在周围观察'), '周围观察完成后应隐藏观察选项');
assert(has('ch2_frenchtown', '问看门老头关于陆姓女子'), '观察完成但未问老头时，应继续显示问老头');
assert(!has('ch2_frenchtown', '上二楼，敲 203'), '观察完成但未问老头时，仍不应直接上203');

reset({ flags: { saw_man: true, asked_landlord: true } });
assert(!has('ch2_building_enter', '先在周围观察'), '沈玉兰线后回商行时，已完成观察应隐藏');
assert(!has('ch2_building_enter', '问看门老头关于陆姓女子'), '问过老头后不应重复显示问老头');
assert(has('ch2_building_enter', '上二楼，敲 203'), '问过老头后应显示上203');

reset({ flags: { saw_man: true, asked_landlord: true } });
assert(has('ch2_203_door', '仔细搜查房间'), '203室未搜查时应显示仔细搜查房间');
assert(!has('ch2_203_door', '回到薛华立路'), '203室不应显示回到薛华立路门口，避免循环');
assert(!has('ch2_203_door', '上二楼，敲 203'), '203室内不应再次显示上203');

reset({
  flags: { saw_man: true, asked_landlord: true },
  clues: [{ name: '法租界地图', desc: '' }],
  items: [{ name: '恐吓信', desc: '' }],
});
assert(!has('ch2_building_enter', '上二楼，敲 203'), '203搜完后不应重复上203');
assert(has('ch2_building_enter', '出示地图'), '203搜完但未查清福生仓标记时，应回老头处核对地图');
assert(!has('ch2_building_enter', '光华小学'), '203搜完但未拿王纸条时，不应直接引导去光华小学');
assert(!has('ch2_203_door', '仔细搜查房间'), '203搜完后不应重复仔细搜查房间');
assert(has('ch2_203_door', '出示地图'), '203搜完后在203室内也应先核对地图标记');
assert(!has('ch2_203_door', '回到薛华立路'), '203搜完后也不应回到薛华立路门口');

reset({
  flags: { saw_man: true, asked_landlord: true, shown_map_to_landlord: true },
  clues: [{ name: '法租界地图', desc: '' }, { name: '福生仓标识', desc: '' }],
  items: [{ name: '恐吓信', desc: '' }],
});
assert(has('ch2_203_search', '回巡捕房'), '203搜完且老头认出福生仓后，应回巡捕房追问仓库线索');
assert(!has('ch2_203_search', '光华小学'), '203搜完但未拿王纸条时，不能直接去光华小学');

reset({
  flags: { saw_man: true, asked_landlord: true, shown_map_to_landlord: true, got_wang_note: true },
  clues: [{ name: '福生仓标识', desc: '' }, { name: '王巡官遗留纸条', desc: '' }],
  items: [{ name: '恐吓信', desc: '' }, { name: '半张烟盒纸', desc: '' }],
});
assert(has('ch2_203_search', '光华小学'), '拿到王巡官纸条后，203线才应引导去光华小学');
assert(!has('ch2_203_search', '回巡捕房'), '拿到王巡官纸条后，不应继续要求回巡捕房');

reset();
assert(has('ch2_building_stakeout', '进永兴贸易商行看看'), '放弃观察跟踪时应写成进永兴贸易商行看看');
assert(!hasOldReturn22('ch2_building_stakeout'), '街对面观察不应出现旧的回22号表述');
assert(has('ch2_tail', '回永兴贸易商行继续搜查'), '尾随放弃时应回永兴贸易商行继续搜查');
assert(!hasOldReturn22('ch2_tail'), '尾随节点不应出现旧的回22号表述');
assert(has('ch2_tea_monitor', '回永兴贸易商行继续搜查'), '茶楼监视后应回永兴贸易商行继续搜查');
assert(!hasOldReturn22('ch2_tea_monitor'), '茶楼监视节点不应出现旧的回22号表述');
assert(has('ch2_talk_woman', '回永兴贸易商行继续搜查'), '与神秘女子对话后应回永兴贸易商行继续搜查');
assert(!hasOldReturn22('ch2_talk_woman'), '与神秘女子对话节点不应出现旧的回22号表述');

reset();
assert(has('ch2_yulan_promise_echo', '回永兴贸易商行'), '沈玉兰托付后应显示回永兴贸易商行继续搜查');
assert(!has('ch2_yulan_promise_echo', '去薛华立路 22 号'), '沈玉兰托付后不应再显示去薛华立路22号');
assert(!has('ch2_yulan_distance_echo', '去薛华立路 22 号'), '沈玉兰边界后不应再显示去薛华立路22号');

if (errors.length) {
  console.error('Xuehua choice smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Xuehua choice smoke passed.');
