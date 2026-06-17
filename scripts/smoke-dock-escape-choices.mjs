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

function renderedChoices(id) {
  rt.renderNode(id);
  return rt.choicesOf(id);
}

function choiceTexts(id) {
  return renderedChoices(id).map(choice => choice.text || choice.fogText || '');
}

function targets(id) {
  return renderedChoices(id).map(choice => typeof choice.goto === 'function' ? choice.goto(E.state) : choice.goto);
}

reset({
  flags: { sun_fast_support: true, found_su_at_dock: true, found_yufang: true },
  items: [{ name: '光华货运单', desc: '' }, { name: '清场指令', desc: '' }],
});
let texts = choiceTexts('ch4_dock_escape');
let choices = renderedChoices('ch4_dock_escape');
let hardConfront = choices.find(choice => (choice.text || '').includes('当场质问傅启元'));
assert(texts.includes('🚓 让便衣护住后路，借雾把人先带走'), '只有一个便衣时，应显示便衣护后路选项');
assert(texts.includes('⚠️ 当场质问傅启元，拿出货运单和清场指令'), '只有一个便衣时，应显示质问高风险选项');
assert(!texts.some(text => text.includes('正面压制傅启元')), '只有一个便衣时，不应显示正面压制傅启元');
assert(typeof hardConfront?.effect === 'function', '单便衣质问应带 effect 计入码头张力');
hardConfront?.effect?.(E.state);
assert(E.getFlag('dock_fast_confront_hard_evidence'), '单便衣质问应设置 dock_fast_confront_hard_evidence');
assert(!E.getFlag('dock_fast_confront_bad'), '单便衣质问不应使用硬失败标记 dock_fast_confront_bad');
assert(E.dockExitTensionScore() >= 11, `单便衣质问应显著提高 tension，实际 ${E.dockExitTensionScore()}`);
assert(E.dockExitControlScore() === 1, `单便衣控场力应很低，实际 ${E.dockExitControlScore()}`);
assert(E.dockExitCrisisScore() > 5, `单便衣质问应因 crisis > 5 触发灭口，实际 ${E.dockExitCrisisScore()}`);
assert(E.fuWillSilenceAtDock(), '单便衣质问应由分数机制触发傅启元灭口');
assert(E.dockExitRiskTier().key === 'lethal', `单便衣质问应是 lethal，实际 ${JSON.stringify(E.dockExitRiskTier())}`);
assert(typeof hardConfront.goto === 'function' && hardConfront.goto(E.state) === 'end_dock_silenced', '单便衣质问应由分数阈值通往码头坏结局');

reset({
  flags: { sun_wait_support: true, sun_support_available: true, found_su_at_dock: true, found_yufang: true, dock_full_support_entry: true },
  items: [{ name: '光华货运单', desc: '' }, { name: '清场指令', desc: '' }],
});
texts = choiceTexts('ch4_dock_escape');
choices = renderedChoices('ch4_dock_escape');
let t = targets('ch4_dock_escape');
assert(texts.includes('🚓 让老孙正面压制傅启元，质问并出示证据'), '老孙带队时，应显示正面压制傅启元');
assert(texts.includes('🌫️ 趁乱带人撤离，不在码头硬碰傅启元'), '老孙带队时，应显示趁乱撤离选项');
assert(!t.includes('end_dock_silenced'), '老孙带队时，不应把质问导向码头坏结局');
assert(t.includes('ch4_fu_confront'), '老孙带队时，正面压制应进入码头对峙');
assert(t.includes('ch4_dock_escape_finish'), '老孙带队时，趁乱撤离应接回逃离码头完成节点');

reset({
  flags: { sun_wait_support: true, sun_support_available: true, dock_sun_pressed_fu: true, dock_full_support_entry: true },
});
rt.renderNode('ch4_fu_confront');
assert(rt.choicesOf('ch4_fu_confront').some(choice => (choice.text || '').includes('立刻送她们离开码头')), '码头对峙后应接回医院前的撤离节点');
assert(E.dockExitRiskTier().key !== 'lethal', '老孙带队压制傅启元不应触发灭口阈值');

if (errors.length) {
  console.error('Dock escape choices smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Dock escape choices smoke passed.');
