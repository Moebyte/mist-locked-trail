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
function assertValidTargets(sceneId, list) {
  for (const choice of list) {
    if (!choice.goto) continue;
    assert(rt.nodes[choice.goto], `${sceneId} 选项「${choice.text}」指向不存在节点 ${choice.goto}`);
  }
}

assert(rt.context.window.MLT_STORY_MODULES?.includes('src/story-modules/lu-evidence-panel.js'), 'story-modules.js 应加载 lu-evidence-panel.js');
for (const id of [
  'ch4_lu_confrontation',
  'ch4_lu_present_waybill',
  'ch4_lu_present_clearance',
  'ch4_lu_present_witnesses',
  'ch4_lu_present_sun_backstop',
  'ch4_lu_present_doctor_record'
]) assert(rt.nodes[id], `必须存在 ${id}`);

reset({
  flags: {
    rescued_yufang: true,
    rescued_su: true,
    sun_support_in_action: true,
    sun_full_support: true,
    hospital_doctor_record: true,
    hospital_stable: true,
  },
  items: [
    { name: '光华货运单', desc: '' },
    { name: '清场指令', desc: '' },
  ],
  clues: [
    { name: '沈玉芳证词', desc: '' },
    { name: '苏晚亭认出银发夹', desc: '' },
    { name: '公董局公文纸', desc: '' },
  ],
});
let text = textOf('ch4_lu_confrontation');
assert(text.includes('陆念薇当前压力'), `陆念薇页面应显示压力面板，实际：${text}`);
assert(text.includes('可信度') && text.includes('程序风险'), `陆念薇压力面板应显示可信度和程序风险，实际：${text}`);
let list = choices('ch4_lu_confrontation');
assertValidTargets('ch4_lu_confrontation', list);
assert(hasChoice(list, '光华货运单', 'ch4_lu_present_waybill'), `应显示货运单举证，实际 ${JSON.stringify(list)}`);
assert(hasChoice(list, '清场指令', 'ch4_lu_present_clearance'), `应显示清场指令举证，实际 ${JSON.stringify(list)}`);
assert(hasChoice(list, '沈玉芳和苏晚亭', 'ch4_lu_present_witnesses'), `应显示证人举证，实际 ${JSON.stringify(list)}`);
assert(hasChoice(list, '老孙', 'ch4_lu_present_sun_backstop'), `应显示老孙程序承接举证，实际 ${JSON.stringify(list)}`);
assert(hasChoice(list, '医生记录', 'ch4_lu_present_doctor_record'), `应显示医生记录举证，实际 ${JSON.stringify(list)}`);

for (const [fragment, nodeId, flag] of [
  ['光华货运单', 'ch4_lu_present_waybill', 'lu_presented_waybill'],
  ['清场指令', 'ch4_lu_present_clearance', 'lu_presented_clearance'],
  ['沈玉芳和苏晚亭', 'ch4_lu_present_witnesses', 'lu_presented_witnesses'],
  ['老孙', 'ch4_lu_present_sun_backstop', 'lu_presented_sun_backstop'],
  ['医生记录', 'ch4_lu_present_doctor_record', 'lu_presented_doctor_record'],
]) {
  list = choices('ch4_lu_confrontation');
  const choice = list.find(choice => choice.text.includes(fragment));
  assert(choice?.goto === nodeId, `「${fragment}」应跳 ${nodeId}，实际 ${JSON.stringify(choice)}`);
  if (!choice) continue;
  choice.effect?.(E.state);
  const t = textOf(nodeId);
  assert(t.length > 20, `${nodeId} 应有正文`);
  assert(E.getFlag(flag), `${nodeId} 应设置 ${flag}`);
  assertValidTargets(nodeId, choices(nodeId));
}

text = textOf('ch4_lu_confrontation');
assert(text.includes('货运单证明') && text.includes('清场指令'), `出示证据后压力摘要应更新，实际：${text}`);
list = choices('ch4_lu_confrontation');
assert(!list.some(choice => choice.goto === 'ch4_lu_present_waybill'), `货运单已出示后不应重复出现，实际 ${JSON.stringify(list)}`);
assert(list.some(choice => choice.goto === 'ch4_fu_private_offer'), `陆念薇程序处理选项应仍保留，实际 ${JSON.stringify(list)}`);

if (errors.length) {
  console.error('Lu evidence panel smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Lu evidence panel smoke passed.');
