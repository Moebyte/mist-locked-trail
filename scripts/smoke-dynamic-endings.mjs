#!/usr/bin/env node
import { loadStoryRuntime } from './story-harness.mjs';

const rt = loadStoryRuntime();
const { E, nodes } = rt;
const errors = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function reset(flags = {}, items = [], clues = []) {
  rt.resetState({ flags, items, clues });
}

function renderText(id) {
  const node = nodes[id];
  assert(node, `缺少结局节点：${id}`);
  if (!node) return '';
  return typeof node.text === 'function' ? String(node.text(E.state)) : String(node.text || '');
}

function title(id) {
  return nodes[id]?.title || '';
}

const fullItems = [{ name: '清场指令', desc: '' }, { name: '光华货运单', desc: '' }];

const expectedTitles = {
  end_true_hidden: '结局 · 破晓之前',
  end_hidden_truth: '结局 · 纸上余光',
  end_conspiracy_detail: '结局 · 雨夜灯火',
  end_partial_truth: '结局 · 缺口真相',
  end_rescue: '结局 · 生还之夜',
  end_evidence_only: '结局 · 空仓余证',
  end_archive: '结局 · 无声归档',
  end_dock_silenced: '结局 · 雾中枪声',
  end_boss_lu: '结局 · 面具之下',
  end_boss_zhao: '结局 · 提线木偶',
  end_boss_wu: '结局 · 师者无声',
};

for (const [id, expected] of Object.entries(expectedTitles)) {
  assert(title(id) === expected, `${id} 应为四字标题 ${expected}，实际 ${title(id)}`);
}

// 真隐藏：10 分真相 + stable/controlled + 陆念薇正式口供 + 非 solo。
reset({
  rescued_yufang: true,
  rescued_su: true,
  found_su_at_dock: true,
  hospital_protect_witnesses: true,
  hospital_separate_witnesses: true,
  hospital_doctor_record: true,
  v07_lu_to_sun: true,
  dock_full_support_entry: true,
}, fullItems);
assert(E.v07ResolveEnding() === 'end_true_hidden', `完整程序真相应进入 end_true_hidden，实际 ${E.v07ResolveEnding()}`);
let text = renderText('end_true_hidden');
assert(text.includes('沈玉芳和苏晚亭都活了下来'), '真隐藏结局应包含双证人动态段');
assert(text.includes('陆念薇最后被交给老孙'), '真隐藏结局应包含陆念薇正式口供动态段');

// 隐藏：8+ 分真相，但陆小姐只是私下口供。
reset({
  rescued_yufang: true,
  rescued_su: true,
  found_su_at_dock: true,
  hospital_protect_witnesses: true,
  v07_lu_statement: true,
}, fullItems);
assert(E.v07ResolveEnding() === 'end_hidden_truth', `私下口供高质量真相应进入 end_hidden_truth，实际 ${E.v07ResolveEnding()}`);
text = renderText('end_hidden_truth');
assert(text.includes('结案状态'), '隐藏结局应包含动态结案状态');
assert(text.includes('陆念薇只留下了一份私下材料'), '隐藏结局应包含陆念薇私下口供段');

// 普通真相：6-7 分真相。
reset({ rescued_yufang: true }, [{ name: '清场指令', desc: '' }]);
assert(E.v07ResolveEnding() === 'end_partial_truth', `单证人单物证应进入缺口真相，实际 ${E.v07ResolveEnding()}`);
text = renderText('end_partial_truth');
assert(text.includes('缺口真相'), '普通真相结局应使用缺口真相四字名');

// 空暗室：零证人 + 全物证。
reset({ dock_entry_committed: true, missed_both_at_dock: true }, fullItems);
assert(E.v07ResolveEnding() === 'end_evidence_only', `零证人全物证应进入空仓余证，实际 ${E.v07ResolveEnding()}`);
text = renderText('end_evidence_only');
assert(text.includes('没有人从福生仓里走出来'), '空仓余证应包含零证人动态段');

// 早期误判：未进入福生仓线也要有说明。
reset({});
text = renderText('end_boss_lu');
assert(text.includes('未进入福生仓线'), '早期误判结局应说明未进入福生仓线');
assert(text.includes('结局 · 面具之下'), '早期误判结局应保留四字结局名');

if (errors.length) {
  console.error('Dynamic endings smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Dynamic endings smoke passed.');
