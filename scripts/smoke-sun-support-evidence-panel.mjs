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
function hasChoice(list, fragment, goto) {
  return list.some(choice => choice.text.includes(fragment) && (!goto || choice.goto === goto));
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

for (const id of [
  'ch4_sun_support',
  'ch4_sun_present_wang_note',
  'ch4_sun_present_chen_letter',
  'ch4_sun_present_fusheng_location',
  'ch4_sun_present_threat',
  'ch4_dock_sun_fast_support'
]) {
  assert(rt.nodes[id], `必须存在 ${id} 节点`);
}

reset({
  flags: {
    deduced_chen: true,
    deduced_lu_zhao: true,
    got_wang_note: true,
    shown_map_to_landlord: true,
  },
  items: [
    { name: '半张烟盒纸', desc: '' },
    { name: '陈明远的信', desc: '' },
    { name: '恐吓信', desc: '' },
    { name: '法租界地图', desc: '' },
    { name: '翡翠镯', desc: '' },
    { name: '苏晚亭疑似遗书', desc: '' },
  ],
  clues: [
    { name: '王巡官遗留纸条', desc: '' },
    { name: '福生仓标识', desc: '' },
    { name: '203 室恐吓信', desc: '' },
  ],
});
let list = choices('ch4_sun_support');
assertValidTargets('ch4_sun_support', list);
assert(hasChoice(list, '王巡官', 'ch4_sun_present_wang_note'), `老孙应可看王巡官纸条，实际 ${JSON.stringify(list)}`);
assert(hasChoice(list, '陈明远', 'ch4_sun_present_chen_letter'), `老孙应可看陈明远的信，实际 ${JSON.stringify(list)}`);
assert(hasRoute(list, 'ch4_sun_present_fusheng_location'), `老孙应可看福生仓位置，实际 ${JSON.stringify(list)}`);
assert(hasRoute(list, 'ch4_sun_present_threat'), `老孙应可看 203 恐吓信，实际 ${JSON.stringify(list)}`);
assert(!list.some(choice => choice.text.includes('翡翠镯') || choice.text.includes('陆念') || choice.text.includes('疑似遗书')), `老孙支援面板不应出现翡翠镯/陆念/疑似遗书，实际 ${JSON.stringify(list)}`);
assert(!list.some(choice => choice.goto === 'ch4_dock_sun_fast_support'), '未出示核心证据前，不应直接低调支援');

for (const [nodeId, flag] of [
  ['ch4_sun_present_wang_note', 'sun_presented_wang_note'],
  ['ch4_sun_present_chen_letter', 'sun_presented_chen_letter'],
  ['ch4_sun_present_fusheng_location', 'sun_presented_fusheng_location'],
  ['ch4_sun_present_threat', 'sun_presented_threat_letter'],
]) {
  list = choices('ch4_sun_support');
  const choice = list.find(choice => choice.goto === nodeId);
  assert(choice, `应存在通往 ${nodeId} 的举证选项，实际 ${JSON.stringify(list)}`);
  if (!choice) continue;
  const text = textOf(choice.goto);
  assert(text.length > 20, `${nodeId} 应有正文`);
  const back = choices(choice.goto);
  assertValidTargets(choice.goto, back);
  choice.effect?.(E.state);
  rt.renderNode(choice.goto);
  assert(E.getFlag(flag), `${nodeId} 应设置 ${flag}`);
}

list = choices('ch4_sun_support');
assert(hasRoute(list, 'ch4_dock_sun_fast_support'), `出示核心证据后应允许低调支援路线，实际 ${JSON.stringify(list)}`);
assert(hasRoute(list, 'ch4_dock_wait'), `出示三件核心证据后应允许调齐人手路线，实际 ${JSON.stringify(list)}`);
const fast = list.find(choice => choice.goto === 'ch4_dock_sun_fast_support');
fast?.effect?.(E.state);
assert(E.getFlag('sun_fast_support'), '低调支援应设置 sun_fast_support');
assert(E.getFlag('sun_support_available'), '低调支援应设置 sun_support_available');

if (errors.length) {
  console.error('Sun support evidence panel smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Sun support evidence panel smoke passed.');
