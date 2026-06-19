#!/usr/bin/env node
// 验证老孙支援的引导式举证面板（取代旧的自由出示）。
// 新流程由 sun-support-evidence-panel.js 提供：玩家在 ch4_sun_support 看到明确的举证选项，
// 不再需要自己想到"出示"这个动作。effect 在目标举证节点上，不在选项上。
import { loadStoryRuntime } from './story-harness.mjs';

const errors = [];
const reports = [];

const h = loadStoryRuntime();
const { E, nodes } = h;

function expectFlag(flag, value = true) {
  return (s) => {
    if (s.flags[flag] !== value) throw new Error(`flag ${flag} 预期 ${value}，实际 ${s.flags[flag]}`);
  };
}

// 渲染 ch4_sun_support，找到 goto 指向 expectedGoto 的选项，
// 跳转到目标节点（其 effect 会设置 sun_presented_* flag），再检查状态。
function sunChoiceTest(name, evidenceState, expectedGoto, expectations = []) {
  h.resetState(evidenceState);
  try {
    h.renderNode('ch4_sun_support');
    const choice = h.choicesOf('ch4_sun_support').find(c => {
      const g = typeof c.goto === 'function' ? c.goto(E.state) : c.goto;
      return g === expectedGoto;
    });
    if (!choice) throw new Error(`ch4_sun_support 缺少通往 ${expectedGoto} 的选项`);
    if (!nodes[expectedGoto]) throw new Error(`缺少举证结果节点：${expectedGoto}`);
    h.renderNode(expectedGoto);
    for (const check of expectations) check(E.state);
    reports.push(`PASS ${name}: -> ${expectedGoto}`);
  } catch (err) {
    errors.push(`${name}: ${err.message}`);
  }
}

sunChoiceTest(
  '老孙支援举证：王巡官半张烟盒纸',
  { items: [{ name: '半张烟盒纸', desc: '' }], flags: { got_wang_note: true } },
  'ch4_sun_present_wang_note',
  [expectFlag('sun_presented_wang_note')]
);

sunChoiceTest(
  '老孙支援举证：陈明远的信',
  { items: [{ name: '陈明远的信', desc: '' }], flags: { got_wang_note: true } },
  'ch4_sun_present_chen_letter',
  [expectFlag('sun_presented_chen_letter')]
);

sunChoiceTest(
  '老孙支援举证：福生仓位置',
  { items: [], clues: [{ name: '福生仓位置' }], flags: { shown_map_to_landlord: true, got_wang_note: true } },
  'ch4_sun_present_fusheng_location',
  [expectFlag('sun_presented_fusheng_location')]
);

sunChoiceTest(
  '老孙支援举证：203室恐吓信',
  { items: [{ name: '恐吓信', desc: '' }], flags: { got_wang_note: true, shown_map_to_landlord: true } },
  'ch4_sun_present_threat',
  [expectFlag('sun_presented_threat_letter')]
);

console.log('Evidence polish smoke reports:');
for (const report of reports) console.log(`- ${report}`);

if (errors.length) {
  console.error('\nEvidence polish smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Evidence polish smoke passed: ${reports.length} interactions.`);
