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

function policeToSchoolState(overrides = {}) {
  return {
    flags: { got_case_file: true, asked_about_chen: true, chen_su_link: true, got_chen_evidence: true, ...(overrides.flags || {}) },
    clues: [{ name: '光华小学事件', desc: '' }, { name: '陈老师与女子争吵', desc: '' }, ...(overrides.clues || [])],
    items: [{ name: '卷宗摘抄', desc: '' }, ...(overrides.items || [])],
    sceneLog: ['ch1_open', 'ch1_ask', 'ch1_take', 'ch2_police', 'ch2_police_file', 'ch3_school'],
    ...(Object.fromEntries(Object.entries(overrides).filter(([key]) => !['flags', 'items', 'clues'].includes(key))))
  };
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
  rt.renderNode(id);
  const text = rt.nodes[id].text;
  return typeof text === 'function' ? text(rt.E.state) : text;
}

function present(sceneId, itemName, desc = '') {
  const scene = rt.renderNode(sceneId);
  return scene.onPresent?.({ name: itemName, desc }, rt.E.state);
}

function runChoice(sceneId, textFragment) {
  const choices = rt.choicesOf(sceneId);
  const choice = choices.find(c => (c.text || '').includes(textFragment));
  if (!choice) throw new Error(`未找到包含“${textFragment}”的选项`);
  if (choice.when && !choice.when(rt.E.state)) throw new Error('选项条件未满足');
  if (typeof choice.effect === 'function') choice.effect(rt.E.state);
  const next = typeof choice.goto === 'function' ? choice.goto(rt.E.state) : choice.goto;
  rt.renderNode(next);
  return { goto: next };
}

// 巡捕房拿卷宗后直接去光华小学：坏路线成立，线索整理页不能回头补课，并允许“吾爱晚亭”收束。
reset(policeToSchoolState({
  flags: { read_letter: true, chen_letter_packet_altered: true },
  items: [{ name: '陈明远残信', desc: '' }, { name: '苏晚亭疑似遗书', desc: '' }],
  clues: [{ name: '陈明远残信', desc: '' }, { name: '苏晚亭疑似遗书', desc: '' }],
}));
assert(!hasChoice('ch3_wrapup', '王巡官的批注'), '直接巡捕房→光华小学后，不应继续显示旧版“追查王巡官批注”入口');
assert(!hasChoice('ch3_wrapup', '回圣约翰大学'), '坏路线成立后，线索整理不应允许回大学补课');
assert(!hasChoice('ch3_wrapup', '回薛华立路'), '坏路线成立后，线索整理不应允许回薛华补课');
assert(!hasChoice('ch3_wrapup', '回巡捕房'), '坏路线成立后，线索整理不应允许回巡捕房补王纸条');
assert(hasChoice('ch3_wrapup', '回访周怀安'), '巡捕房→光华坏路线拿到两封信后，应允许直接回访周怀安');
assert(hasChoice('ch3_wrapup', '残信和那封疑似遗书'), '回访周怀安入口应明确残信和疑似遗书');
assert(hasChoice('ch3_wrapup', '证据链仍不完整') || hasChoice('ch3_wrapup', '把手头材料重新摊开'), '过早整理线索时，结案入口应提示证据链不完整');

rt.renderNode('ch4_conclusion');
assert(conclusionText().includes('证据链不足'), '坏路线进入结案页时，应明确提示证据链不足');
assert(!hasChoice('ch4_conclusion', '先不结案'), '坏路线结案页不应允许倒回补查');

// 专属触发：读陈明远信时，只有巡捕房→光华路线才获得残信 + 疑似遗书。
reset(policeToSchoolState());
const alteredText = nodeText('ch3_chen_letter');
assert(alteredText.includes('信封边缘压得很平'), '巡捕房→光华路线读信应出现被整理过的信封');
rt.nodes.ch3_chen_letter.effect?.(rt.E.state);
assert(rt.E.hasItem('陈明远残信'), '巡捕房→光华路线读信后，应获得陈明远残信');
assert(rt.E.hasItem('苏晚亭疑似遗书'), '巡捕房→光华路线读信后，应获得苏晚亭疑似遗书');
assert(!rt.E.hasItem('苏晚亭的伪造遗书'), '玩家侧不应获得名为“伪造遗书”的物品');
assert(!nodeText('ch3_chen_letter').includes('伪造'), '陈明远信节点不应直接剧透遗书是伪造的');

// 查过苏家婚约反证后，不能再导向《吾爱晚亭》。
reset(policeToSchoolState({
  flags: { read_letter: true, chen_letter_packet_altered: true, su_mother_knows_zhou_fiance: true },
  clues: [{ name: '苏母知道周怀安婚约', desc: '' }, { name: '陈明远残信', desc: '' }, { name: '苏晚亭疑似遗书', desc: '' }],
  items: [{ name: '陈明远残信', desc: '' }, { name: '苏晚亭疑似遗书', desc: '' }],
}));
assert(!hasChoice('ch3_wrapup', '残信和那封疑似遗书'), '查过苏家婚约后不应再出现吾爱晚亭入口');
const blockedNote = present('ch4_revisit_zhou', '苏晚亭疑似遗书');
assert(blockedNote?.text?.includes('不能再把案子压成“为情而去”'), `查过苏家后出示疑似遗书应只给反证提示，实际 ${JSON.stringify(blockedNote)}`);
assert(blockedNote?.goto !== 'end_zhou_chen_letter', '查过苏家后不能跳吾爱晚亭');

// 坏路线当铺只是旁证；结局需要两封信并置。
reset(policeToSchoolState({
  flags: { read_letter: true, chen_letter_packet_altered: true },
  items: [{ name: '陈明远残信', desc: '' }, { name: '苏晚亭疑似遗书', desc: '' }],
  clues: [{ name: '陈明远残信', desc: '' }, { name: '苏晚亭疑似遗书', desc: '' }],
}));
rt.renderNode('ch4_pawnshop');
assert(nodeText('ch4_pawnshop').includes('旁证'), '坏路线当铺文本应说明当铺只是旁证');
const zhouText = nodeText('ch4_revisit_zhou');
assert(zhouText.includes('晚亭吾爱'), '坏路线周怀安回访应提示陈明远的信');
assert(zhouText.includes('遗书'), '坏路线周怀安回访应提示苏晚亭疑似遗书');
assert(!zhouText.includes('伪造遗书'), '周怀安回访入口不应提前剧透遗书伪造');
const chenFirst = runChoice('ch4_revisit_zhou', '陈明远');
assert(chenFirst.goto === 'ch4_zhou_present_chen_letter', '坏路线先出示陈明远残信，应进入晚亭吾爱举证节点');
const noteSecond = runChoice('ch4_revisit_zhou', '遗书');
assert(noteSecond.goto === 'end_zhou_chen_letter', '第二封出示疑似遗书后应触发吾爱晚亭结局');
assert(nodeText('end_zhou_chen_letter').includes('结局 · 吾爱晚亭'), '应进入吾爱晚亭结局');

// 前置线索充足路线：读陈明远的信时不应获得疑似遗书。
reset({
  flags: { got_wang_note: true, shown_map_to_landlord: true, deduced_fusheng: true, rescued_yufang: true, rescued_su: true, read_letter: true },
  clues: [{ name: '法租界地图', desc: '' }, { name: '福生仓标识', desc: '' }, { name: '推理结论：法租界利益链', desc: '' }],
  items: [{ name: '半张烟盒纸', desc: '' }, { name: '法租界地图', desc: '' }, { name: '陈明远的信', desc: '' }],
  sceneLog: ['ch1_open', 'ch1_take', 'ch2_university', 'ch2_frenchtown', 'ch2_landlord', 'ch2_police', 'ch2_police_file', 'ch3_school'],
});
rt.renderNode('ch3_chen_letter');
assert(!rt.E.hasItem('苏晚亭疑似遗书'), '前置线索充足路线读陈明远的信时，不应获得疑似遗书');
assert(!nodeText('ch3_chen_letter').includes('遗书'), '前置线索充足路线的陈明远信文本不应追加遗书剧情');
assert(hasChoice('ch4_conclusion', '按证据链自然收束此案'), '证据链充分时，应保留正常自然收束入口');
assert(hasChoice('ch4_conclusion', '推理——指认幕后真凶'), '证据链充分时，应保留正常指认入口');
assert(!conclusionText().includes('证据链不足'), '证据链充分时不应显示坏路线提示');
const fullRouteChen = present('ch4_revisit_zhou', '陈明远的信');
assert(!fullRouteChen, '完整证据路线下，陈明远的信不应触发吾爱晚亭彩蛋');
const fullRouteNote = present('ch4_revisit_zhou', '苏晚亭疑似遗书');
assert(!fullRouteNote, '完整证据路线下，即使异常持有疑似遗书也不应触发吾爱晚亭彩蛋');
assert(!rt.E.getFlag('zhou_chen_letter_easter_egg'), '完整证据路线下，不应强行进入吾爱晚亭结局');

// 非直达光华的坏路线也不能获得专属伪造包。
reset({
  flags: { got_case_file: true, asked_about_chen: true, chen_su_link: true, got_chen_evidence: true },
  clues: [{ name: '法租界地图', desc: '' }],
  items: [{ name: '卷宗摘抄', desc: '' }, { name: '法租界地图', desc: '' }],
  sceneLog: ['ch1_open', 'ch1_take', 'ch2_university', 'ch2_police', 'ch2_police_file', 'ch3_school'],
});
const detourText = nodeText('ch3_chen_letter');
assert(!detourText.includes('信封边缘压得很平'), '非直达光华路线不应出现被整理过的信封');
rt.nodes.ch3_chen_letter.effect?.(rt.E.state);
assert(!rt.E.hasItem('陈明远残信'), '非直达光华路线不应获得陈明远残信');
assert(!rt.E.hasItem('苏晚亭疑似遗书'), '非直达光华路线不应获得苏晚亭疑似遗书');

if (errors.length) {
  console.error('Premature conclusion polish smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Premature conclusion polish smoke passed.');
