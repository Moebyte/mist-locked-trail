#!/usr/bin/env node
import { loadStoryRuntime } from './story-harness.mjs';

const rt = loadStoryRuntime();
const { E, nodes } = rt;
const errors = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function reset(overrides = {}) {
  rt.resetState(overrides);
}

function renderText(id) {
  rt.renderNode(id);
  const node = nodes[id];
  return typeof node.text === 'function' ? node.text(E.state) : node.text;
}

function choicesText(id) {
  rt.renderNode(id);
  return rt.choicesOf(id).map(choice => choice.text || choice.fogText || '').join('\n');
}

reset({
  flags: {
    rescued_yufang: true,
    rescued_su: true,
    found_su_at_dock: true,
    fu_waybill_exposed: true,
    fu_clearance_exposed: true,
    v07_lu_confronted: true,
    v07_rejected_fu_deal: true,
  },
  clues: [
    { name: '公董局公文纸', desc: '' },
    { name: '教具箱走私', desc: '' },
  ],
  items: [
    { name: '光华货运单', desc: '' },
    { name: '清场指令', desc: '' },
  ],
});

const text = renderText('ch4_conclusion');
assert(!/调查质量\s+1[1-9]\s*分/.test(text), '终局总结不应显示 18 分这类内部叠加分');
assert(/案件质量 · .* · \d+\/10/.test(text), '终局总结应显示案件质量等级 + 10 分制');
assert(/压力指数 · .* · \d+\/8/.test(text), '终局总结应显示压力指数');
assert(text.includes('⚫ 福生仓真相推理'), '未完成第三段推理时，应显示福生仓真相推理未完成');
assert(text.includes('福生仓现场证据已经到手'), '现场证据已到手但未推理时，应提示最后一步推理');

const choices = choicesText('ch4_conclusion');
assert(choices.includes('先推理——福生仓与公董局的真相'), '终局页应提供先推理福生仓与公董局的入口');

reset({
  flags: {
    rescued_yufang: true,
    rescued_su: true,
    deduced_fusheng: true,
    school_wu_three_proofs: true,
    fu_waybill_exposed: true,
    fu_clearance_exposed: true,
    v07_witnesses_protected: true,
    v07_lu_confronted: true,
    v07_rejected_fu_deal: true,
    dock_sun_pressed_fu: true,
  },
});
const goodText = renderText('ch4_conclusion');
assert(goodText.includes('✅ 福生仓真相推理'), '完成第三段推理后，应显示福生仓真相推理已完成');
const goodQuality = E.finalCaseQuality();
const goodPressure = E.finalPressureProfile();

reset({
  pressure: { heat: 5, deadline: { day: 2, hour: 23, minute: 0 } },
  flags: {
    rescued_yufang: true,
    rescued_su: true,
    deduced_fusheng: true,
    school_wu_three_proofs: true,
    fu_waybill_exposed: true,
    fu_clearance_exposed: true,
    v07_lu_confronted: true,
    dock_escaped_during_sun_standoff: true,
    v07_choice_blockade_after_interference: true,
  },
});
renderText('ch4_conclusion');
const badQuality = E.finalCaseQuality();
const badPressure = E.finalPressureProfile();
assert(badQuality.points < goodQuality.points, `公董局插手/高热度路线应降低案件质量，good=${goodQuality.points}, bad=${badQuality.points}`);
assert(badPressure.value > goodPressure.value, `公董局插手/高热度路线应提高压力指数，good=${goodPressure.value}, bad=${badPressure.value}`);

if (errors.length) {
  console.error('Conclusion summary smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Conclusion summary smoke passed.');
