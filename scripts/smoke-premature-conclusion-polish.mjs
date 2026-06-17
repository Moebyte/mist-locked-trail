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

function choiceTexts(id) {
  return rt.choicesOf(id).map(choice => choice.text || choice.fogText || '');
}

function hasChoice(id, fragment) {
  return choiceTexts(id).some(text => text.includes(fragment));
}

function conclusionText() {
  const text = rt.nodes.ch4_conclusion.text;
  return typeof text === 'function' ? text(rt.E.state) : text;
}

reset({
  flags: { got_case_file: true, asked_about_chen: true, chen_su_link: true, got_chen_evidence: true, read_letter: true },
  clues: [{ name: '光华小学事件', desc: '' }, { name: '陈老师与女子争吵', desc: '' }],
  items: [{ name: '卷宗摘抄', desc: '' }],
});
assert(!hasChoice('ch3_wrapup', '王巡官的批注'), '直接巡捕房→光华小学后，不应继续显示旧版“追查王巡官批注”入口');
assert(hasChoice('ch3_wrapup', '回圣约翰大学'), '缺大学线时，线索整理应引导回大学补查');
assert(hasChoice('ch3_wrapup', '证据链仍不完整'), '过早整理线索时，结案入口应提示证据链仍不完整');

rt.renderNode('ch4_conclusion');
assert(conclusionText().includes('证据链不足'), '坏路线进入结案页时，应明确提示证据链不足');
assert(hasChoice('ch4_conclusion', '先不结案'), '坏路线结案页应允许返回补查');
assert(hasChoice('ch4_conclusion', '证据不足，暂时归档'), '坏路线自然收束应改成证据不足归档');
assert(hasChoice('ch4_conclusion', '证据不足，仍要冒然指认'), '坏路线指认应改成冒然指认');
assert(!hasChoice('ch4_conclusion', '按证据链自然收束此案'), '证据不足时不应显示正常自然收束文案');

reset({
  flags: { got_case_file: true },
  clues: [{ name: '光华小学事件', desc: '' }, { name: '法租界地图', desc: '' }],
  items: [{ name: '卷宗摘抄', desc: '' }, { name: '法租界地图', desc: '' }],
});
assert(hasChoice('ch3_wrapup', '回薛华立路'), '有大学线但未查清仓库标记时，应引导回薛华立路');
assert(!hasChoice('ch3_wrapup', '王巡官的批注'), '未查清仓库标记时不应显示追查王巡官批注');

reset({
  flags: { got_case_file: true, shown_map_to_landlord: true },
  clues: [{ name: '光华小学事件', desc: '' }, { name: '法租界地图', desc: '' }, { name: '福生仓标识', desc: '' }],
  items: [{ name: '卷宗摘抄', desc: '' }, { name: '法租界地图', desc: '' }],
});
assert(hasChoice('ch3_wrapup', '回巡捕房'), '查清福生仓标记但未拿王纸条时，才应引导回巡捕房');
assert(hasChoice('ch3_wrapup', '福生仓与王巡官'), '回巡捕房入口应明确是追问福生仓与王巡官线索');

reset({
  flags: { got_wang_note: true, deduced_fusheng: true, rescued_yufang: true, rescued_su: true },
  clues: [{ name: '推理结论：法租界利益链', desc: '' }],
  items: [{ name: '半张烟盒纸', desc: '' }],
});
assert(hasChoice('ch4_conclusion', '按证据链自然收束此案'), '证据链充分时，应保留正常自然收束入口');
assert(hasChoice('ch4_conclusion', '推理——指认幕后真凶'), '证据链充分时，应保留正常指认入口');
assert(!conclusionText().includes('证据链不足'), '证据链充分时不应显示坏路线提示');

if (errors.length) {
  console.error('Premature conclusion polish smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Premature conclusion polish smoke passed.');
