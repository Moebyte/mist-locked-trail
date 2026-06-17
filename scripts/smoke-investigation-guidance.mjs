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

function textOf(id) {
  const node = rt.renderNode(id);
  return typeof node.text === 'function' ? node.text(rt.E.state) : node.text;
}

function choiceTexts(id) {
  return rt.choicesOf(id).map(choice => choice.text || choice.fogText || '');
}

reset({ clues: [{ name: '法租界地图', desc: '' }, { name: '铅笔清单', desc: '' }] });
const guidedText = textOf('ch2_leave_univ');
const guidedChoices = choiceTexts('ch2_leave_univ');
assert(guidedText.includes('地址，不是证据链'), '大学后未查巡捕房时，应提示薛华立路只是地址，不是证据链');
assert(guidedText.includes('王巡官线索'), '大学后未查巡捕房时，应提示王巡官线索重要');
assert(guidedChoices.some(text => text.includes('先去巡捕房查卷宗')), '大学后未查巡捕房时，应强化巡捕房选项文案');

reset({
  flags: { got_case_file: true },
  clues: [{ name: '法租界地图', desc: '' }, { name: '光华小学事件', desc: '' }],
  items: [{ name: '卷宗摘抄', desc: '' }],
});
const afterPoliceText = textOf('ch2_leave_univ');
const afterPoliceChoices = choiceTexts('ch2_leave_univ');
assert(!afterPoliceText.includes('地址，不是证据链'), '已查巡捕房后，不应重复提示卷宗必经');
assert(!afterPoliceChoices.some(text => text.includes('先去巡捕房查卷宗')), '已查巡捕房后，不应继续强化巡捕房选项');

if (errors.length) {
  console.error('Investigation guidance smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Investigation guidance smoke passed.');
