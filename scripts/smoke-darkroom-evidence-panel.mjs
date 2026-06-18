#!/usr/bin/env node
import { loadStoryRuntime } from './story-harness.mjs';

const rt = loadStoryRuntime();
const { E } = rt;
const errors = [];

function assert(condition, message) { if (!condition) errors.push(message); }
function reset(overrides = {}) { rt.resetState(overrides); }
function choices(id) {
  rt.renderNode(id);
  return rt.choicesOf(id).map(choice => ({
    text: choice.text || choice.fogText || '',
    goto: typeof choice.goto === 'function' ? choice.goto(E.state) : choice.goto,
    effect: choice.effect,
  }));
}
function textOf(id) {
  rt.renderNode(id);
  const node = rt.nodes[id];
  return typeof node.text === 'function' ? String(node.text(E.state)) : String(node.text || '');
}
function hasRoute(list, goto) {
  return list.some(choice => choice.goto === goto);
}
function assertValidTargets(sceneId, list) {
  for (const choice of list) {
    if (!choice.goto) continue;
    assert(rt.nodes[choice.goto], `${sceneId} 选项「${choice.text}」指向不存在节点 ${choice.goto}`);
  }
}

assert(rt.context.window.MLT_STORY_MODULES?.includes('src/story-modules/darkroom-evidence-panel.js'), 'story-modules.js 应加载 darkroom-evidence-panel.js');
assert(rt.nodes.ch4_dock_who_dual, '必须存在 ch4_dock_who_dual');
assert(rt.nodes.ch4_su_present_keepsake, '必须存在 ch4_su_present_keepsake');
assert(rt.nodes.ch4_yufang_quick_testimony, '必须存在 ch4_yufang_quick_testimony');

// 有银发夹和沈玉芳证据时，暗室应显示两个明确举证路径；玩家文案允许保持叙事化，测试只认路线和状态。
reset({
  flags: { found_su_at_dock: true, shown_photo_to_mother: true },
  items: [
    { name: '苏晚亭的银发夹', desc: '' },
    { name: '三人合影', desc: '' },
    { name: '陈明远的信', desc: '' },
    { name: '日记残页', desc: '' },
  ],
  clues: [{ name: '苏母托付信物', desc: '' }],
});
let text = textOf('ch4_dock_who_dual');
assert(text.includes('暗室内可用证据'), `暗室应显示可用证据摘要，实际：${text}`);
assert(text.includes('苏母托付的银发夹'), `暗室摘要应提示银发夹未出示，实际：${text}`);
let list = choices('ch4_dock_who_dual');
assertValidTargets('ch4_dock_who_dual/full', list);
assert(hasRoute(list, 'ch4_su_present_keepsake'), `暗室应显示银发夹建立信任路径，实际 ${JSON.stringify(list)}`);
assert(hasRoute(list, 'ch4_yufang_quick_testimony'), `暗室应显示沈玉芳快速确认证词路径，实际 ${JSON.stringify(list)}`);

const keepsake = list.find(choice => choice.goto === 'ch4_su_present_keepsake');
keepsake?.effect?.(E.state);
rt.renderNode('ch4_su_present_keepsake');
assert(E.getFlag('presented_su_keepsake'), '银发夹按钮应设置 presented_su_keepsake');
assert(E.hasClue('苏晚亭认出银发夹'), '银发夹按钮应获得苏晚亭认出银发夹线索');
let afterKeepsake = choices('ch4_su_present_keepsake');
assertValidTargets('ch4_su_present_keepsake', afterKeepsake);
assert(hasRoute(afterKeepsake, 'ch4_yufang_quick_testimony'), `银发夹后应还能确认沈玉芳证词，实际 ${JSON.stringify(afterKeepsake)}`);

const yufang = afterKeepsake.find(choice => choice.goto === 'ch4_yufang_quick_testimony');
yufang?.effect?.(E.state);
rt.renderNode('ch4_yufang_quick_testimony');
assert(E.getFlag('yufang_testimony_quick_confirmed'), '沈玉芳按钮应设置 yufang_testimony_quick_confirmed');
assert(E.getFlag('presented_photo_to_yufang_dual'), '沈玉芳按钮应同步 presented_photo_to_yufang_dual');
assert(E.getFlag('presented_letter_to_yufang_dual'), '沈玉芳按钮应同步 presented_letter_to_yufang_dual');
assert(E.getFlag('presented_diary_to_yufang_dual'), '沈玉芳按钮应同步 presented_diary_to_yufang_dual');
let afterYufang = choices('ch4_yufang_quick_testimony');
assertValidTargets('ch4_yufang_quick_testimony', afterYufang);
assert(hasRoute(afterYufang, 'ch4_dock_escape'), `证词确认且已建立信任后应能带两人离开，实际 ${JSON.stringify(afterYufang)}`);

// 没有苏家信物时，面板应明确提示只能先带沈玉芳离开；玩家文案允许用现场行动表达。
reset({
  flags: { found_su_at_dock: true },
  items: [{ name: '三人合影', desc: '' }],
});
text = textOf('ch4_dock_who_dual');
assert(text.includes('没有任何能证明自己去过苏家的东西'), `无信物时应明确提示苏晚亭信任不足，实际：${text}`);
list = choices('ch4_dock_who_dual');
assertValidTargets('ch4_dock_who_dual/no-token', list);
assert(!list.some(choice => choice.goto === 'ch4_su_present_keepsake'), `无信物时不应显示银发夹按钮，实际 ${JSON.stringify(list)}`);
const escape = list.find(choice => choice.goto === 'ch4_dock_escape');
assert(escape, `无信物时应显示只救沈玉芳撤离路径，实际 ${JSON.stringify(list)}`);
escape?.effect?.(E.state);
assert(E.getFlag('darkroom_yufang_only_escape'), '无信物撤离应设置 darkroom_yufang_only_escape');
assert(E.getFlag('su_trust_failed_in_darkroom'), '无信物撤离应设置 su_trust_failed_in_darkroom');

if (errors.length) {
  console.error('Darkroom evidence panel smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Darkroom evidence panel smoke passed.');
