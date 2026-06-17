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

function assertNoSpoilerChoice(texts, label) {
  const joined = texts.join('\n');
  const spoilers = ['苏晚亭', '沈玉芳', '人质', '错过', '转走', '没有工具', '砸锁'];
  for (const spoiler of spoilers) {
    assert(!joined.includes(spoiler), `${label} 选项不应剧透“${spoiler}”：${joined}`);
  }
}

const preparedFlags = {
  school_wu_three_proofs: true,
  got_wang_note: true,
  sister_case: true,
  shown_photo_to_mother: true,
  sun_fast_support: true,
  sun_support_available: true,
};
const preparedClues = [{ name: '王巡官遗留纸条', desc: '' }, { name: '沈玉芳', desc: '' }, { name: '苏母认出照片', desc: '' }];
const preparedItems = [{ name: '苏晚亭的银发夹', desc: '' }, { name: '铁钎', desc: '' }];

reset({
  flags: preparedFlags,
  clues: preparedClues,
  items: preparedItems,
});
let opts = choices('ch4_dock_crates');
let texts = opts.map(choice => choice.text || choice.fogText || '');
assert(texts.includes('📦 躲进空木箱，等守卫过去'), '教具箱后应提供躲进木箱选项');
assert(texts.includes('⚠️ 趁脚步声靠近前，立刻往暗门走'), '教具箱后应提供不躲直接去暗门的风险选项');
assert(opts.find(choice => (choice.text || '').includes('暗门走'))?.goto === 'ch4_dock_guard_chase', '不躲应进入守卫追击节点');
assertNoSpoilerChoice(texts, '教具箱后');

reset({
  flags: preparedFlags,
  clues: preparedClues,
  items: preparedItems,
});
rt.renderNode('ch4_dock_hide');
assert(E.getFlag('dock_hid_in_crate'), '躲进木箱应记录谨慎拖延标记');
assert(E.dockDelayScore() > 0, '躲进木箱应增加拖延分，而不是完全免费');
assert(E.routeDockDeepByPressure() === 'ch4_dock_deep_dual', '单次躲藏不应直接惩罚为错失苏晚亭，仍由累计风险决定');

reset({
  pressure: { heat: 1, deadline: { day: 2, hour: 23, minute: 0 } },
  flags: { ...preparedFlags, skipped_dock_hide: true, dock_guard_chase_no_hide: true },
  clues: preparedClues,
  items: preparedItems,
});
assert(E.routeDockDeepByPressure() === 'ch4_dock_deep_trace', '不躲触发一次追击后，应由累计风险判为只剩一人，而不是一票否决空暗室');

reset({
  flags: preparedFlags,
  clues: preparedClues,
  items: [{ name: '苏晚亭的银发夹', desc: '' }],
});
opts = choices('ch4_dock_full_search');
texts = opts.map(choice => choice.text || choice.fogText || '');
assert(texts.includes('🗂️ 先摸进临时账房查看桌上的公文夹'), '完整搜查时应先显示临时账房选项');
assert(texts.includes('🚶 贴着货架慢慢往仓库深处移动'), '完整搜查时应显示慢速货架推进选项');
assert(texts.includes('⚠️ 趁货架阴影，快速穿过中间通道'), '完整搜查时应显示冒险快速穿过选项');
assert(!texts.some(text => text.includes('教具箱')), '完整搜查入口不应直接显示教具箱');
assertNoSpoilerChoice(texts, '完整搜查');

opts = choices('ch4_dock_shelf_approach');
texts = opts.map(choice => choice.text || choice.fogText || '');
assert(texts.includes('📦 先检查旁边的教具箱'), '到达货架深处后才应显示检查教具箱选项');
assert(texts.includes('🔦 先循着敲击声去仓库深处'), '到达货架深处后应显示循声找人选项');
assert(texts.includes('⚠️ 直接跨过散落草绳，抢到木箱后面'), '货架深处应有快速抢位的 heat 坑');
assert(opts.find(choice => (choice.text || '').includes('敲击声'))?.goto === 'ch4_dock_locked_door', '循声找人应先到暗门节点');
assertNoSpoilerChoice(texts, '货架深处');

opts = choices('ch4_dock_locked_door');
texts = opts.map(choice => choice.text || choice.fogText || '');
assert(texts.includes('⚠️ 试着强行打开旧锁'), '没有铁钎时应显示强行打开旧锁选项');
assert(opts.find(choice => (choice.text || '').includes('强行打开'))?.goto === 'ch4_dock_break_lock_chase', '强行打开旧锁应进入追击节点');
assert(opts.find(choice => (choice.text || '').includes('折回去找'))?.goto === 'ch4_dock_return_for_tool', '折回去找东西应进入错失双人质节点');
assertNoSpoilerChoice(texts, '暗门无工具');

opts = choices('ch4_dock_return_for_tool');
texts = opts.map(choice => choice.text || choice.fogText || '');
assert(texts.includes('🚪 带着铁钎赶回暗门'), '回头找工具后应赶回暗门');
assert(opts[0]?.goto === 'ch4_dock_empty_after_return', '回头找工具后应进入专属空暗室');

reset({
  pressure: { heat: 2, deadline: { day: 2, hour: 23, minute: 0 } },
  flags: { ...preparedFlags, dock_broke_lock_no_tool: true },
  clues: preparedClues,
  items: [{ name: '苏晚亭的银发夹', desc: '' }],
});
assert(E.routeDockDeepByPressure() === 'ch4_dock_deep_trace', '不检查教具箱强行开锁后，应由累计风险判为只剩一人');

reset({
  flags: { ...preparedFlags, missed_both_due_to_return_tool: true },
  clues: preparedClues,
  items: [{ name: '苏晚亭的银发夹', desc: '' }],
});
assert(E.routeDockDeepByPressure() === 'ch4_dock_empty_after_return', '回头找工具后，应错失沈玉芳和苏晚亭，进入空暗室');

if (errors.length) {
  console.error('Dock hide consequence smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Dock hide consequence smoke passed.');
