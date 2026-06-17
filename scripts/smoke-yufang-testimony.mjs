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

function text(id) {
  rt.renderNode(id);
  const node = rt.nodes[id];
  return typeof node.text === 'function' ? node.text(E.state) : node.text;
}

const baseFlags = {
  got_wang_note: true,
  sister_case: true,
  rescued_yufang: true,
  found_yufang: true,
  found_su_at_dock: true,
  shown_photo_to_mother: true,
  presented_su_keepsake: true,
};

const baseItems = [
  { name: '苏晚亭的银发夹', desc: '' },
  { name: '清场指令', desc: '' },
  { name: '光华货运单', desc: '' },
];

reset({
  flags: { ...baseFlags },
  items: baseItems,
  clues: [{ name: '王巡官遗留纸条', desc: '' }, { name: '沈玉芳', desc: '' }],
});
let c = choices('ch4_dock_who_dual');
assert(!c.some(choice => (choice.text || '').includes('快速确认')), '没有沈玉芳可确认的证据时，不应显示快速确认证词选项');
assert(!E.hasYufangTestimonyBoost(), '未确认前不应有沈玉芳证词强化');

reset({
  flags: { ...baseFlags },
  items: [...baseItems, { name: '三人合影', desc: '' }],
  clues: [{ name: '王巡官遗留纸条', desc: '' }, { name: '沈玉芳', desc: '' }],
});
c = choices('ch4_dock_who_dual');
const confirm = c.find(choice => (choice.text || '').includes('快速确认'));
assert(confirm, '有三人合影等证据时，应显示沈玉芳快速确认证词选项');
const beforeWitness = E.witnessStabilityScore();
const beforeTruth = E.truthCompletenessTier().score;
const beforeQuality = E.v07InvestigationQuality().score;
confirm?.effect?.(E.state);
assert(E.hasYufangTestimonyBoost(), '执行快速确认后，应有沈玉芳证词强化');
assert(E.getFlag('yufang_confirmed_photo'), '三人合影应被沈玉芳确认');
assert(E.hasClue('沈玉芳暗室证词强化'), '快速确认应增加沈玉芳暗室证词强化线索');
assert(E.witnessStabilityScore() > beforeWitness, `沈玉芳证词强化应提高 witness，之前 ${beforeWitness} 之后 ${E.witnessStabilityScore()}`);
assert(E.truthCompletenessTier().score >= beforeTruth, '沈玉芳证词强化不应降低真相完整度');
assert(E.v07InvestigationQuality().score > beforeQuality, `沈玉芳证词强化应提高终局质量分，之前 ${beforeQuality} 之后 ${E.v07InvestigationQuality().score}`);
const confirmText = text('ch4_yufang_quick_testimony');
assert(confirmText.includes('证词已强化'), '证词确认节点应明确说明这是证词强化');
assert(confirmText.includes('救援成败仍由撤离和苏晚亭信物决定'), '证词确认节点应说明它不是救援硬门槛');

reset({
  flags: { ...baseFlags },
  items: [...baseItems, { name: '陈明远的信', desc: '' }, { name: '日记残页', desc: '' }],
  clues: [{ name: '王巡官遗留纸条', desc: '' }, { name: '沈玉芳', desc: '' }],
});
c = choices('ch4_dock_who_dual');
c.find(choice => (choice.text || '').includes('快速确认'))?.effect?.(E.state);
assert(E.getFlag('yufang_confirmed_chen_letter'), '陈明远的信应被沈玉芳确认');
assert(E.getFlag('yufang_confirmed_su_agency'), '日记残页应确认苏晚亭主动追查');
assert(choices('ch4_dock_who_dual').filter(choice => (choice.text || '').includes('快速确认')).length === 0, '确认后不应重复显示快速确认证词选项');

reset({
  flags: { ...baseFlags },
  items: baseItems,
  clues: [{ name: '王巡官遗留纸条', desc: '' }, { name: '沈玉芳', desc: '' }],
});
assert(E.routeDockDeepByPressure() !== 'ch4_dock_no_darkroom', '不做沈玉芳证词强化不应阻断暗门/救援路线');
assert(!E.hasYufangTestimonyBoost(), '不做确认也不应自动获得证词强化');

if (errors.length) {
  console.error('Yufang testimony smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Yufang testimony smoke passed.');
