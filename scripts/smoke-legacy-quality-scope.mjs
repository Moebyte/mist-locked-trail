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

const fullItems = [{ name: '清场指令', desc: '' }, { name: '光华货运单', desc: '' }];
const fullClues = [{ name: '公董局公文纸', desc: '' }, { name: '教具箱走私', desc: '' }];

// 福生仓前：旧质量分仍作为调查成熟度存在。
reset({
  flags: {
    deduced_chen: true,
    deduced_lu_zhao: true,
    school_wu_three_proofs: true,
  },
});
let q = E.v07InvestigationQuality();
assert(q.scope === 'pre_fusheng', `福生仓前旧质量分应为 pre_fusheng，实际 ${JSON.stringify(q)}`);
assert(q.label === '福生仓前调查成熟度', `福生仓前 label 不正确：${JSON.stringify(q)}`);

// 第三段完成后：旧质量分退役，分数封顶，不再能触发旧隐藏/真隐藏。
reset({
  flags: {
    deduced_fusheng: true,
    school_wu_three_proofs: true,
    rescued_yufang: true,
    rescued_su: true,
    found_yufang: true,
    found_su_at_dock: true,
    hospital_protect_witnesses: true,
    hospital_separate_witnesses: true,
    hospital_doctor_record: true,
    v07_choice_protect_witnesses: true,
    v07_lu_statement: true,
  },
  items: fullItems,
  clues: fullClues,
});
q = E.v07InvestigationQuality();
assert(q.scope === 'deprecated_after_fusheng', `第三段后旧质量分应退役，实际 ${JSON.stringify(q)}`);
assert(q.label === '旧推理质量分已退役', `第三段后 label 不正确：${JSON.stringify(q)}`);
assert(q.score <= 5, `第三段后旧质量分应封顶到不会触发旧隐藏，实际 ${JSON.stringify(q)}`);
assert(q.finalTruth && q.finalTruth.truth, `退役后的 quality 应携带 finalTruth 诊断，实际 ${JSON.stringify(q)}`);

// 最终结局仍应由动态真相体系决定，而不是旧 quality 高分。
const ending = E.v07ResolveEnding();
assert(ending !== 'end_archive', `高质量第三段后不应因旧 quality 退役而掉成 archive，实际 ${ending}`);
assert(ending !== 'end_too_late', `第三段后不应回到旧迟到结局，实际 ${ending}`);

if (errors.length) {
  console.error('Legacy quality scope smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Legacy quality scope smoke passed.');
