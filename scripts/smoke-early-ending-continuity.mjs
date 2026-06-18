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

function hasChoice(list, fragment, goto) {
  return list.some(choice => choice.text.includes(fragment) && (!goto || choice.goto === goto));
}

function assertNoEarlyEndingSpoilers(text, label) {
  for (const word of ['走私团伙', '违禁品交易', '公董局公章', '法租界高层', '幕后操纵者', '真正的幕后']) {
    assert(!text.includes(word), `${label} 不应反向剧透：${word}，实际：${text}`);
  }
}

// 早期结案页应先形成“案卷写法”，而不是开发者式失败提示。
reset({
  flags: {
    school_incomplete_closure: true,
    school_truth_partial_only: true,
    deduced_chen: true,
    chen_letter_packet_altered: true,
  },
  items: [
    { name: '陈明远残信', desc: '' },
    { name: '苏晚亭疑似遗书', desc: '' },
  ],
  clues: [
    { name: '推理结论：陈明远被灭口', desc: '' },
    { name: '203 室恐吓信', desc: '' },
    { name: '三人合影', desc: '' },
    { name: '光华小学箱子异常', desc: '' },
  ],
});
let text = textOf('ch4_conclusion');
assert(text.includes('案卷'), `早期结案页应呈现案卷写法，实际：${text}`);
assert(text.includes('不是完整答案'), `早期结案页应说明不是完整答案，实际：${text}`);
assert(text.includes('更容易被人接受'), `早期结案页应说明表层答案的诱惑，实际：${text}`);
assertNoEarlyEndingSpoilers(text, '早期结案页');
let list = choices('ch4_conclusion');
assert(hasChoice(list, '残信和疑似遗书', 'ch4_revisit_zhou'), `有残信包时应提供周怀安入口，实际 ${JSON.stringify(list)}`);
assert(hasChoice(list, '暂时归档', 'end_archive'), `早期结案页应提供归档，实际 ${JSON.stringify(list)}`);
assert(hasChoice(list, '压成一份指认', 'ch4_accuse'), `早期结案页应提供冒然指认，实际 ${JSON.stringify(list)}`);

// 早期指认页应弱化为“把现有材料落到某个名字”，不再宣称完整幕后。
text = textOf('ch4_accuse');
assert(text.includes('每一条线都能指向一个人'), `早期指认页应强调线索断裂，实际：${text}`);
assert(text.includes('不是破案'), `早期指认页应说明不是完整破案，实际：${text}`);
assertNoEarlyEndingSpoilers(text, '早期指认页');
list = choices('ch4_accuse');
assert(hasChoice(list, '旧名、当票和203室', 'end_boss_lu'), `早期陆小姐指认应基于现有证据，实际 ${JSON.stringify(list)}`);
assert(hasChoice(list, '一直在盯陆小姐和沈玉芳', 'end_boss_zhao'), `早期赵先生指认应基于跟踪，实际 ${JSON.stringify(list)}`);
assert(hasChoice(list, '学校口径最能把事情压下去', 'end_boss_wu'), `早期吴校长指认应基于学校口径，实际 ${JSON.stringify(list)}`);

// 三个早期指认结局不得反向交代后期真相。
for (const [id, title] of [['end_boss_lu', '面具之下'], ['end_boss_zhao', '提线木偶'], ['end_boss_wu', '师者无声']]) {
  text = textOf(id);
  assert(text.includes(`结局 · ${title}`), `${id} 应保留四字结局名，实际：${text}`);
  assert(text.includes('案卷') || text.includes('报告'), `${id} 应呈现早期案卷收束，实际：${text}`);
  assertNoEarlyEndingSpoilers(text, id);
}

// 完整线不应被早期结局桥覆盖。
reset({
  flags: {
    deduced_fusheng: true,
    rescued_yufang: true,
  },
});
text = textOf('ch4_conclusion');
assert(!text.includes('几种不同的写法'), `完整线 ch4_conclusion 不应被早期桥覆盖，实际：${text}`);

if (errors.length) {
  console.error('Early ending continuity smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Early ending continuity smoke passed.');
