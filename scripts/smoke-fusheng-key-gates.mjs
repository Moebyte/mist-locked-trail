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

function renderText(id) {
  rt.renderNode(id);
  const node = rt.nodes[id];
  return typeof node.text === 'function' ? node.text(E.state) : node.text;
}

function choices(id) {
  rt.renderNode(id);
  return rt.choicesOf(id);
}

reset({ flags: {}, clues: [], items: [] });
assert(typeof E.fushengKeyState === 'function', '应提供统一的 fushengKeyState');
let k = E.fushengKeyState();
assert(!k.entry, '无王巡官纸条时，福生仓入口钥匙应为 false');
assert(!k.darkroom, '无沈玉芳线时，暗门识别钥匙应为 false');
assert(!k.suTrustToken, '无苏母信物时，苏晚亭信任钥匙应为 false');

reset({
  flags: { got_wang_note: true },
  clues: [{ name: '王巡官遗留纸条', desc: '' }],
  items: []
});
k = E.fushengKeyState();
assert(k.entry, '王巡官纸条应解锁福生仓入口钥匙');
assert(!k.darkroom, '没有沈玉芳线时，暗门识别钥匙仍应为 false');
const noDarkroomText = renderText('ch4_dock_no_darkroom');
assert(noDarkroomText.includes('少了一把钥匙'), '无沈玉芳线进入仓库时，应提示缺少暗门识别钥匙');
assert(E.routeDockDeepByPressure() === 'ch4_dock_no_darkroom', `缺少沈玉芳线时应进搜查断线，实际 ${E.routeDockDeepByPressure()}`);

reset({
  flags: { got_wang_note: true, sister_case: true },
  clues: [{ name: '王巡官遗留纸条', desc: '' }, { name: '沈玉芳', desc: '' }],
  items: []
});
k = E.fushengKeyState();
assert(k.entry && k.darkroom, '王巡官纸条 + 沈玉芳线应具备入口和暗门钥匙');
assert(!k.suTrustToken, '未去苏家时不应有苏晚亭信任钥匙');
let dualText = renderText('ch4_dock_deep_dual');
assert(dualText.includes('没有任何东西能证明你真的去过她家'), '找到苏晚亭但无信物时，应提示苏晚亭不信任');
let whoChoices = choices('ch4_dock_who_dual');
assert(whoChoices.some(choice => (choice.text || '').includes('没有信物')), '无苏母信物时，离开暗室选项应提示强行带走风险');

reset({
  flags: { got_wang_note: true, sister_case: true, shown_photo_to_mother: true },
  clues: [{ name: '王巡官遗留纸条', desc: '' }, { name: '沈玉芳', desc: '' }, { name: '苏母认出照片', desc: '' }],
  items: [{ name: '苏晚亭的银发夹', desc: '' }]
});
k = E.fushengKeyState();
assert(k.suTrustToken && !k.suTrustProof, '有苏母信物但未出示时，应是 token=true proof=false');
whoChoices = choices('ch4_dock_who_dual');
const keepsakeChoice = whoChoices.find(choice => (choice.text || '').includes('银发夹'));
assert(keepsakeChoice, '有苏母信物时，暗室应直接提供出示银发夹选项');
keepsakeChoice?.effect?.(E.state);
assert(E.getFlag('presented_su_keepsake'), '出示银发夹选项应设置 presented_su_keepsake');
assert(E.fushengKeyState().canRescueSu, '出示银发夹后应允许苏晚亭救援钥匙通过');

reset({
  flags: { got_wang_note: true, sister_case: true, found_su_at_dock: true, found_yufang: true },
  clues: [{ name: '王巡官遗留纸条', desc: '' }, { name: '沈玉芳', desc: '' }],
  items: []
});
rt.renderNode('ch4_dock_escape_finish');
const finishNode = rt.nodes.ch4_dock_escape_finish;
finishNode.effect?.(E.state);
assert(E.getFlag('su_rescue_failed_no_home_trust'), '见到苏晚亭但无信物，逃离完成时应标记苏晚亭救援失败');
assert(E.getFlag('su_lost_without_home_trust'), '无信物导致苏晚亭在撤退中失去，应设置 su_lost_without_home_trust');
assert(!E.getFlag('rescued_su'), '无信物时不应标记 rescued_su');
const finishText = renderText('ch4_dock_escape_finish');
assert(finishText.includes('双救路线关闭'), '无信物逃离文本应明确双救路线关闭');

if (errors.length) {
  console.error('Fusheng key gates smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Fusheng key gates smoke passed.');
