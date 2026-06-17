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

const fullItems = [{ name: '清场指令', desc: '' }, { name: '光华货运单', desc: '' }];
const fullClues = [{ name: '公董局公文纸', desc: '' }, { name: '教具箱走私', desc: '' }];

// solo 低风险进暗室应获得独有线索与苏晚亭信任。
reset({
  flags: {
    dock_solo_entry: true,
    dock_entry_committed: true,
    dock_exit_side_lane: true,
    dock_clearance_seen_inside: true,
    found_door_tool: true,
    dock_hid_in_crate: true,
  },
  items: fullItems,
  clues: fullClues,
  pressure: { heat: 0, deadline: { day: 2, hour: 23, minute: 0 } },
});
assert(E.dockHeatTier().key === 'low', `solo 优秀潜入应是低风险，实际 ${JSON.stringify(E.dockHeatTier())}`);
if (typeof nodes.ch4_dock_deep_dual.effect === 'function') nodes.ch4_dock_deep_dual.effect(E.state);
assert(E.getFlag('solo_darkroom_marks'), 'solo 低风险进入双人暗室应获得暗室刻痕');
assert(E.hasClue('暗室刻痕'), 'solo 暗室奖励应加入暗室刻痕线索');
assert(E.getFlag('solo_rescuer_trust'), 'solo 救出苏晚亭应获得醒后信任标记');

// 醒后信任应提升医院证人稳定，但不能在强迫指认或周怀安过早入场时生效。
reset({
  flags: {
    rescued_yufang: true,
    rescued_su: true,
    found_su_at_dock: true,
    solo_rescuer_trust: true,
  },
});
const stableWithTrust = E.witnessStabilityScore();
reset({
  flags: {
    rescued_yufang: true,
    rescued_su: true,
    found_su_at_dock: true,
  },
});
const stableWithoutTrust = E.witnessStabilityScore();
assert(stableWithTrust === stableWithoutTrust + 1, `solo 醒后信任应 witness +1，实际 ${stableWithoutTrust} -> ${stableWithTrust}`);
reset({
  flags: {
    rescued_yufang: true,
    rescued_su: true,
    found_su_at_dock: true,
    solo_rescuer_trust: true,
    hospital_force_su_identify: true,
  },
});
assert(E.witnessStabilityScore() <= stableWithTrust - 1, '强迫苏晚亭指认时，醒后信任不应抵消医院伤害');

// 暗室刻痕应轻微提高陆小姐可信度。
reset({
  flags: {
    rescued_yufang: true,
    rescued_su: true,
    found_su_at_dock: true,
    hospital_protect_witnesses: true,
  },
  items: fullItems,
  clues: fullClues,
});
const luBase = E.luCredibilityScore();
E.setFlag('solo_darkroom_marks', true);
assert(E.luCredibilityScore() === Math.min(10, luBase + 1), `暗室刻痕应使陆小姐可信度 +1，实际 ${luBase} -> ${E.luCredibilityScore()}`);

// solo 高质量路线不应进最高程序真隐藏，而应进四字变种“孤灯照雾”。
reset({
  flags: {
    dock_solo_entry: true,
    dock_entry_committed: true,
    dock_exit_side_lane: true,
    found_yufang: true,
    found_su_at_dock: true,
    rescued_yufang: true,
    rescued_su: true,
    hospital_protect_witnesses: true,
    hospital_separate_witnesses: true,
    hospital_doctor_record: true,
    v07_lu_statement: true,
    solo_darkroom_marks: true,
    solo_rescuer_trust: true,
  },
  items: fullItems,
  clues: fullClues,
});
assert(E.truthCompletenessTier().score >= 9, `solo 高质量路线应至少 9 分真相，实际 ${JSON.stringify(E.truthCompletenessTier())}`);
assert(E.v07ResolveEnding() === 'end_solo_lantern', `solo 高质量路线应进入孤灯照雾，实际 ${E.v07ResolveEnding()}`);
assert(nodes.end_solo_lantern?.title === '结局 · 孤灯照雾', `solo 变种结局应为四字标题，实际 ${nodes.end_solo_lantern?.title}`);
const text = typeof nodes.end_solo_lantern?.text === 'function' ? nodes.end_solo_lantern.text(E.state) : String(nodes.end_solo_lantern?.text || '');
assert(text.includes('孤灯照雾'), 'solo 变种结局文本应包含孤灯照雾');
assert(text.includes('不是“破晓之前”'), 'solo 变种结局应说明它不是正式程序最优');

// solo 当面质问仍不奖励。
reset({
  flags: {
    dock_solo_entry: true,
    dock_entry_committed: true,
    dock_no_support_confront: true,
    dock_no_support_witness_exposed: true,
    dock_no_support_hard_evidence: true,
    found_yufang: true,
    found_su_at_dock: true,
    rescued_yufang: true,
    rescued_su: true,
    hospital_protect_witnesses: true,
    v07_lu_statement: true,
  },
  items: fullItems,
  clues: fullClues,
});
assert(E.v07ResolveEnding() !== 'end_solo_lantern', 'solo 当面质问傅启元不应进入孤灯照雾');

if (errors.length) {
  console.error('Solo reward ending smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Solo reward ending smoke passed.');
