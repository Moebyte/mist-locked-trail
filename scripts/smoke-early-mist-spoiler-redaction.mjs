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

function runEffect(id) {
  const node = rt.nodes[id];
  if (typeof node?.effect === 'function') node.effect(E.state);
}

function assertNoEarlySpoilers(text, label) {
  for (const word of ['傅启元', '管制药品', '走私', '军用纱布', '最上面的人']) {
    assert(!text.includes(word), `${label} 不应提前出现完整真相词：${word}，实际：${text}`);
  }
}

// 大学日记只能提供苏晚亭视角碎片，不应替玩家得出完整结论。
reset({});
let text = textOf('ch2_univ_paper');
assert(text.includes('你还不知道她究竟看见了什么'), `大学日记应保留迷雾视角，实际：${text}`);
assertNoEarlySpoilers(text, '大学日记');

// 203 搜查只能把玩家拉回学校，不能说“中心”。
reset({});
text = textOf('ch2_203_search');
assert(text.includes('还拼不成完整答案'), `203 搜查应说明仍不完整，实际：${text}`);
assert(text.includes('重新拉回那所学校'), `203 搜查应只导向学校，实际：${text}`);
assert(!text.includes('这一切的中心'), `203 搜查不应提前说“中心”，实际：${text}`);
assertNoEarlySpoilers(text, '203 搜查');

// 陈明远的信不能直接点名傅启元、走私和药品；只能留下箱子、恐吓、203、电话这些碎片。
reset({});
text = textOf('ch3_chen_letter');
assert(text.includes('箱子外面写着‘光华小学教学器材’'), `陈明远信应保留箱子异常，实际：${text}`);
assert(text.includes('不要相信学校里最先递来的说法'), `陈明远信应保留不可信电话/说法线索，实际：${text}`);
assert(text.includes('这封信没有给出答案'), `陈明远信应说明不是完整答案，实际：${text}`);
assertNoEarlySpoilers(text, '陈明远的信');

runEffect('ch3_chen_letter');
assert(E.hasClue('光华小学箱子异常'), '陈明远信应给出软线索：光华小学箱子异常');
assert(!E.hasClue('傅启元夜运教具箱'), '早期陈明远信不应直接给出傅启元夜运教具箱');
assert(!E.hasClue('管制药品走私'), '早期陈明远信不应直接给出管制药品走私');

// 软线索仍应满足第一段推理需要，避免去剧透后卡死。
E.addClue('陈明远的退缩', '');
E.addClue('203 室恐吓信', '');
assert(E.canDeduce('deduce_chen'), `软线索应允许开启第一段推理，缺：${E.deductionMissingFor?.('deduce_chen')?.join('、')}`);

if (errors.length) {
  console.error('Early mist spoiler redaction smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Early mist spoiler redaction smoke passed.');
