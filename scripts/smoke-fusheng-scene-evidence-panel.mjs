#!/usr/bin/env node
import { loadStoryRuntime } from './story-harness.mjs';

const rt = loadStoryRuntime();
const { E } = rt;
const errors = [];

function assert(condition, message) { if (!condition) errors.push(message); }
function reset(overrides = {}) { rt.resetState(overrides); }
function textOf(id) {
  rt.renderNode(id);
  const node = rt.nodes[id];
  return typeof node.text === 'function' ? String(node.text(E.state)) : String(node.text || '');
}
function choices(id) {
  rt.renderNode(id);
  return rt.choicesOf(id).map(choice => ({
    text: choice.text || choice.fogText || '',
    goto: typeof choice.goto === 'function' ? choice.goto(E.state) : choice.goto,
    effect: choice.effect,
  }));
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

assert(rt.context.window.MLT_STORY_MODULES?.includes('src/story-modules/fusheng-scene-evidence-panel.js'), 'story-modules.js 应加载 fusheng-scene-evidence-panel.js');

for (const id of ['ch4_dock_inside', 'ch4_dock_crates', 'ch4_dock_shelf_approach', 'ch4_dock_deep', 'ch4_fu_confront', 'ch4_dock_escape']) {
  assert(rt.nodes[id], `必须存在 ${id}`);
}

// 入口/账房类节点应显示现场确认摘要，并能确认清场指令。
reset({ flags: {} });
let text = textOf('ch4_dock_inside');
assert(text.includes('福生仓现场确认'), `ch4_dock_inside 应显示现场确认面板，实际：${text}`);
assert(E.getFlag('scene_confirmed_clearance_order'), '进入 ch4_dock_inside 后应确认清场指令');
assert(E.hasItem('清场指令'), '确认清场后应获得清场指令');
assert(E.hasClue('现场确认：清场指令'), '确认清场后应获得现场确认线索');
let list = choices('ch4_dock_inside');
assertValidTargets('ch4_dock_inside', list);

// 教具箱节点应确认货运单/教具箱走私。
reset({ flags: {} });
text = textOf('ch4_dock_crates');
assert(text.includes('福生仓现场确认'), `ch4_dock_crates 应显示现场确认面板，实际：${text}`);
assert(E.getFlag('scene_confirmed_waybill_crates'), '进入 ch4_dock_crates 后应确认货运单/教具箱');
assert(E.hasItem('光华货运单'), '确认教具箱后应获得光华货运单');
assert(E.hasClue('现场确认：光华货运单'), '确认教具箱后应获得现场确认货运单线索');
list = choices('ch4_dock_crates');
assertValidTargets('ch4_dock_crates', list);

// 货架核心区应提供回头确认清场纸/确认教具箱路线；玩家文案允许保持现场动作描述。
reset({ flags: {} });
text = textOf('ch4_dock_shelf_approach');
assert(text.includes('福生仓现场确认'), `ch4_dock_shelf_approach 应显示现场确认面板，实际：${text}`);
list = choices('ch4_dock_shelf_approach');
assertValidTargets('ch4_dock_shelf_approach', list);
assert(hasRoute(list, 'ch4_dock_crates'), `货架区应可进入教具箱/货运单确认路线，实际 ${JSON.stringify(list)}`);
assert(hasRoute(list, 'ch4_dock_inner_office'), `货架区应可回头确认蓝封纸路线，实际 ${JSON.stringify(list)}`);

// 暗室节点应提供关押痕迹确认；不强制按钮写成测试标签。
reset({ flags: {} });
text = textOf('ch4_dock_deep');
assert(text.includes('福生仓现场确认'), `ch4_dock_deep 应显示现场确认面板，实际：${text}`);
list = choices('ch4_dock_deep');
assertValidTargets('ch4_dock_deep', list);
const dark = list.find(choice => choice.goto === 'ch4_dock_deep' && typeof choice.effect === 'function');
assert(dark, `暗室节点应能现场确认关押痕迹，实际 ${JSON.stringify(list)}`);
dark?.effect?.(E.state);
assert(E.getFlag('scene_confirmed_darkroom_marks'), '确认暗室后应设置 scene_confirmed_darkroom_marks');
assert(E.hasClue('现场确认：暗室关押痕迹'), '确认暗室后应获得现场确认暗室线索');

// 码头对话链条只应在真正对峙节点确认，避免普通逃离页提前点名人物。
reset({ flags: {} });
text = textOf('ch4_fu_confront');
assert(text.includes('福生仓现场确认'), `ch4_fu_confront 应显示现场确认面板，实际：${text}`);
list = choices('ch4_fu_confront');
assertValidTargets('ch4_fu_confront', list);
const conv = list.find(choice => choice.goto === 'ch4_fu_confront' && typeof choice.effect === 'function');
assert(conv, `码头对峙节点应能记录人物链条，实际 ${JSON.stringify(list)}`);
conv?.effect?.(E.state);
assert(E.getFlag('scene_confirmed_fu_lu_conversation'), '记录对话链条后应设置 scene_confirmed_fu_lu_conversation');
assert(E.hasClue('现场确认：码头对话'), '记录对话链条后应获得现场确认人物链条线索');

reset({ flags: {} });
text = textOf('ch4_dock_escape');
assert(text.includes('福生仓现场确认'), `ch4_dock_escape 应显示现场确认面板，实际：${text}`);
list = choices('ch4_dock_escape');
assertValidTargets('ch4_dock_escape', list);
assert(!list.some(choice => String(choice.text || '').includes('傅启元') || String(choice.text || '').includes('陆念薇')), `普通逃离页不应提前点名人物链条，实际 ${JSON.stringify(list)}`);

if (errors.length) {
  console.error('Fusheng scene evidence panel smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Fusheng scene evidence panel passed.');
