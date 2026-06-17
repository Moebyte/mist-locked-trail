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

function nodeText(id) {
  const text = rt.nodes[id].text;
  return typeof text === 'function' ? text(rt.E.state) : text;
}

function present(sceneId, itemName, desc = '') {
  const scene = rt.renderNode(sceneId);
  return scene.onPresent?.({ name: itemName, desc }, rt.E.state);
}

reset({
  flags: { got_case_file: true, asked_about_chen: true, chen_su_link: true, got_chen_evidence: true, read_letter: true },
  clues: [{ name: '光华小学事件', desc: '' }, { name: '陈老师与女子争吵', desc: '' }],
  items: [{ name: '卷宗摘抄', desc: '' }, { name: '陈明远的信', desc: '信的开头是“晚亭吾爱”。' }],
});
assert(!hasChoice('ch3_wrapup', '王巡官的批注'), '直接巡捕房→光华小学后，不应继续显示旧版“追查王巡官批注”入口');
assert(!hasChoice('ch3_wrapup', '回圣约翰大学'), '坏路线成立后，线索整理不应允许回大学补课');
assert(!hasChoice('ch3_wrapup', '回薛华立路'), '坏路线成立后，线索整理不应允许回薛华补课');
assert(!hasChoice('ch3_wrapup', '回巡捕房'), '坏路线成立后，线索整理不应允许回巡捕房补王纸条');
assert(hasChoice('ch3_wrapup', '去当铺'), '坏路线仍应允许去当铺查翡翠镯');
assert(hasChoice('ch3_wrapup', '证据链仍不完整'), '过早整理线索时，结案入口应提示证据链仍不完整');

rt.renderNode('ch4_conclusion');
assert(conclusionText().includes('证据链不足'), '坏路线进入结案页时，应明确提示证据链不足');
assert(!hasChoice('ch4_conclusion', '先不结案'), '坏路线结案页不应允许倒回补查');
assert(hasChoice('ch4_conclusion', '证据不足，暂时归档'), '坏路线自然收束应改成证据不足归档');
assert(hasChoice('ch4_conclusion', '证据不足，仍要冒然指认'), '坏路线指认应改成冒然指认');
assert(!hasChoice('ch4_conclusion', '按证据链自然收束此案'), '证据不足时不应显示正常自然收束文案');

reset({
  flags: { got_case_file: true },
  clues: [{ name: '光华小学事件', desc: '' }, { name: '法租界地图', desc: '' }],
  items: [{ name: '卷宗摘抄', desc: '' }, { name: '法租界地图', desc: '' }],
});
assert(!hasChoice('ch3_wrapup', '回薛华立路'), '有大学线但已从光华小学过早整理时，也不应允许回薛华补课');
assert(!hasChoice('ch3_wrapup', '王巡官的批注'), '未查清仓库标记时不应显示追查王巡官批注');
assert(hasChoice('ch3_wrapup', '去当铺'), '坏路线仍应保留当铺彩蛋线');

reset({
  flags: { got_case_file: true, shown_map_to_landlord: true },
  clues: [{ name: '光华小学事件', desc: '' }, { name: '法租界地图', desc: '' }, { name: '福生仓标识', desc: '' }],
  items: [{ name: '卷宗摘抄', desc: '' }, { name: '法租界地图', desc: '' }],
});
assert(!hasChoice('ch3_wrapup', '回巡捕房'), '查清福生仓标记但已过早整理时，也不应允许回巡捕房补王纸条');
assert(hasChoice('ch3_wrapup', '证据链仍不完整'), '查清标记但没拿王纸条时，应仍提示证据链不完整');

reset({
  flags: { got_case_file: true, asked_about_chen: true, chen_su_link: true, got_chen_evidence: true, read_letter: true },
  clues: [{ name: '光华小学事件', desc: '' }, { name: '陈明远的信', desc: '' }],
  items: [{ name: '陈明远的信', desc: '信的开头是“晚亭吾爱”。' }],
});
rt.renderNode('ch4_pawnshop');
assert(rt.E.hasItem('小报剪报'), '坏路线当铺应获得小报剪报');
assert(rt.E.hasClue('殉情误报'), '坏路线当铺应记录殉情误报线索');
assert(nodeText('ch4_pawnshop').includes('殉身'), '坏路线当铺文本应出现殉情误报标题');
assert(hasChoice('ch4_pawnshop', '小报剪报'), '坏路线当铺回访周怀安选项应提到小报剪报');

const zhouText = nodeText('ch4_revisit_zhou');
assert(zhouText.includes('晚亭吾爱'), '坏路线周怀安回访应提示可出示陈明远的信');
assert(zhouText.includes('小报剪报') || zhouText.includes('殉情'), '坏路线周怀安回访应提示小报误报');
const jadeResult = present('ch4_revisit_zhou', '翡翠镯');
assert(jadeResult?.goto === 'ch4_zhou_present_jade_premature', '坏路线向周怀安出示翡翠镯应进入弱证据节点');
rt.renderNode(jadeResult.goto);
assert(rt.E.hasClue('周怀安识出陆念'), '坏路线翡翠镯仍应记录陆念旧名线索');
const letterResult = present('ch4_revisit_zhou', '陈明远的信');
assert(letterResult?.goto === 'end_zhou_chen_letter', '向周怀安出示陈明远的信应触发“吾爱晚亭”结局');
rt.renderNode('end_zhou_chen_letter');
assert(rt.E.getFlag('zhou_chen_letter_easter_egg'), '吾爱晚亭结局应设置对应 flag');
assert(rt.E.hasClue('周怀安读到陈明远的信'), '吾爱晚亭结局应记录周怀安读信线索');
assert(nodeText('end_zhou_chen_letter').includes('苏姓女学生疑为情殉身'), '吾爱晚亭结局应并置小报殉情误报');
assert(nodeText('end_zhou_chen_letter').includes('不是去死。她是在找人，也是在救人'), '吾爱晚亭结局应回到找人主题');

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
