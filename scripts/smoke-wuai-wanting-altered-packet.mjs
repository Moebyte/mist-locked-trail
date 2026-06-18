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
  }));
}

function runEffect(id) {
  const node = rt.nodes[id];
  if (typeof node?.effect === 'function') node.effect(E.state);
}

function hasChoice(list, fragment, goto) {
  return list.some(choice => choice.text.includes(fragment) && (!goto || choice.goto === goto));
}

// 坏路线：读陈明远信时应变成被整理过的信封，得到残信 + 疑似遗书。
reset({
  flags: {},
  items: [],
  clues: [],
});
let text = textOf('ch3_chen_letter');
assert(text.includes('信封边缘压得很平'), `坏路线陈明远信应出现被重新封过的迹象，实际：${text}`);
assert(text.includes('信纸下半截也不见了'), `坏路线陈明远信应是残信，实际：${text}`);
assert(text.includes('这个信封究竟保留了什么，又拿走了什么'), `坏路线应强调信息被整理过但不能当场识破，实际：${text}`);
runEffect('ch3_chen_letter');
assert(E.getFlag('chen_letter_packet_altered'), '坏路线应设置 chen_letter_packet_altered');
assert(E.hasItem('陈明远残信'), '坏路线应获得陈明远残信');
assert(E.hasItem('苏晚亭疑似遗书'), '坏路线应获得苏晚亭疑似遗书');
assert(E.hasClue('陈明远残信'), '坏路线应加入陈明远残信线索');
assert(E.hasClue('苏晚亭疑似遗书'), '坏路线应加入苏晚亭疑似遗书线索');

// 没查苏家婚约反证时，回访周怀安入口仍可出现。
let list = choices('ch3_wrapup');
assert(hasChoice(list, '残信和那封疑似遗书', 'ch4_revisit_zhou'), `未查苏家婚约时应提供吾爱晚亭入口，实际 ${JSON.stringify(list)}`);

// 周怀安读信文本应与残信设定一致。
text = textOf('ch4_zhou_present_chen_letter');
assert(text.includes('陈明远那封残信'), `周怀安读陈明远信应称残信，实际：${text}`);
assert(text.includes('信纸下半截缺了'), `周怀安读信应提到残缺，实际：${text}`);
text = textOf('ch4_zhou_present_su_last_letter');
assert(text.includes('疑似苏晚亭留下的遗书'), `周怀安遗书文本应称疑似遗书，实际：${text}`);
assert(text.includes('陈明远那封残信'), `遗书后续应要求看残信，实际：${text}`);

// 最终《吾爱晚亭》应是错误收束，但不提前写成玩家已识破伪造。
text = textOf('end_zhou_chen_letter');
assert(text.includes('残信和疑似遗书'), `吾爱晚亭结局应并置残信和疑似遗书，实际：${text}`);
assert(text.includes('没有证明那封疑似遗书是真是假'), `吾爱晚亭不应让玩家当场识破伪造，实际：${text}`);
assert(text.includes('结局 · 吾爱晚亭'), `应保留四字结局名，实际：${text}`);

// 查过苏家并确认周怀安婚约后，残信 + 疑似遗书不能再导向《吾爱晚亭》。
reset({
  flags: {
    chen_letter_packet_altered: true,
    su_mother_knows_zhou_fiance: true,
  },
  items: [
    { name: '陈明远残信', desc: '' },
    { name: '苏晚亭疑似遗书', desc: '' },
  ],
  clues: [
    { name: '陈明远残信', desc: '' },
    { name: '苏晚亭疑似遗书', desc: '' },
    { name: '苏母知道周怀安婚约', desc: '' },
  ],
});
list = choices('ch3_wrapup');
assert(!hasChoice(list, '残信和那封疑似遗书', 'ch4_revisit_zhou'), `查过苏家婚约后不应再从 wrapup 进入吾爱晚亭，实际 ${JSON.stringify(list)}`);
text = textOf('ch4_revisit_zhou');
assert(text.includes('苏母已经说过') && text.includes('周怀安是晚亭的未婚夫'), `查过苏家后周怀安页应提示疑似遗书站不稳，实际：${text}`);
const result = rt.nodes.ch4_revisit_zhou.onPresent({ name: '苏晚亭疑似遗书' }, E.state);
assert(result?.text?.includes('不能再把案子压成“为情而去”'), `查过苏家后出示疑似遗书应只给反证提示，实际 ${JSON.stringify(result)}`);
assert(result?.goto !== 'end_zhou_chen_letter', `查过苏家后不能跳吾爱晚亭，实际 ${JSON.stringify(result)}`);

// 正常路线：前置齐全时不应额外得到疑似遗书/残信。
reset({
  flags: {
    shown_map_to_landlord: true,
    got_wang_note: true,
  },
  items: [
    { name: '法租界地图', desc: '' },
    { name: '半张烟盒纸', desc: '' },
  ],
  clues: [
    { name: '法租界地图', desc: '' },
    { name: '陆小姐的笔记', desc: '' },
  ],
});
runEffect('ch3_chen_letter');
assert(!E.hasItem('陈明远残信'), '正常路线不应获得陈明远残信');
assert(!E.hasItem('苏晚亭疑似遗书'), '正常路线不应获得苏晚亭疑似遗书');

if (errors.length) {
  console.error('Wuai Wanting altered packet smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Wuai Wanting altered packet smoke passed.');
