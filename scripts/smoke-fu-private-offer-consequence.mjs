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

function choices(id) {
  rt.renderNode(id);
  return rt.choicesOf(id).map(choice => ({
    text: choice.text || choice.fogText || '',
    goto: typeof choice.goto === 'function' ? choice.goto(E.state) : choice.goto,
    effect: choice.effect,
    when: choice.when,
  }));
}

const fullItems = [{ name: '清场指令', desc: '' }, { name: '光华货运单', desc: '' }];

assert(rt.context.window.MLT_STORY_MODULES?.includes('src/story-modules/fu-private-offer-consequence-polish.js'), 'story-modules.js 应加载傅启元后巷交易后果系统');
assert(typeof E.fuOfferLeverageScore === 'function', '应提供 fuOfferLeverageScore');
assert(typeof E.fuOfferPressureScore === 'function', '应提供 fuOfferPressureScore');
assert(typeof E.fuOfferConsequenceTier === 'function', '应提供 fuOfferConsequenceTier');

reset({
  flags: {
    rescued_yufang: true,
    rescued_su: true,
    found_su_at_dock: true,
    hospital_protect_witnesses: true,
    hospital_separate_witnesses: true,
    hospital_doctor_record: true,
    v07_lu_to_sun: true,
    dock_sun_pressed_fu: true,
    v07_choice_hold_blockade: true,
  },
  items: fullItems,
});
let list = choices('ch4_fu_private_offer');
assert(list.some(choice => choice.text.includes('假装答应交易')), '傅启元交易应保留假意答应选项');
assert(list.some(choice => choice.text.includes('当面拒绝交易')), '傅启元交易应提供当面拒绝选项');
assert(list.some(choice => choice.text.includes('申报') && choice.text.includes('反压')), '傅启元交易应提供《申报》/老孙反制选项');
let press = list.find(choice => choice.text.includes('申报'));
assert(!press.when || press.when(E.state), '证人、物证、正式口供齐全时，应允许媒体/老孙反制');
press?.effect?.(E.state);
let tier = E.fuOfferConsequenceTier();
assert(tier.key === 'press_counter_success' || tier.key === 'hard_reject_success', `高筹码反制应成功，实际 ${JSON.stringify(tier)}`);
assert(E.getFlag('fu_offer_counter_success'), '反制成功应设置 fu_offer_counter_success');
assert(E.truthCompletenessTier().score >= 10, `成功反制不应压低完整真相，实际 ${JSON.stringify(E.truthCompletenessTier())}`);

reset({
  flags: {
    rescued_yufang: true,
    dock_escaped_during_sun_standoff: true,
    v07_choice_blockade_after_interference: true,
    hospital_early_lu: true,
    hospital_interrogate_yufang: true,
  },
  items: [{ name: '清场指令', desc: '' }],
});
list = choices('ch4_fu_private_offer');
let reject = list.find(choice => choice.text.includes('当面拒绝交易'));
reject?.effect?.(E.state);
tier = E.fuOfferConsequenceTier();
assert(tier.key === 'bureau_intervention', `低筹码强拒应导致公董局强行介入，实际 ${JSON.stringify(tier)}`);
assert(E.getFlag('hospital_bureau_forced_entry'), '公董局强行介入应标记医院被压入失控风险');
assert(E.hospitalOutcomeTier().key === 'unstable', `公董局强行介入后医院应失控，实际 ${JSON.stringify(E.hospitalOutcomeTier())}`);

reset({
  flags: {
    rescued_yufang: true,
    v07_lu_withdrawn: true,
  },
  items: [{ name: '光华货运单', desc: '' }],
});
list = choices('ch4_fu_private_offer');
let accept = list.find(choice => choice.text.includes('假装答应交易'));
accept?.effect?.(E.state);
tier = E.fuOfferConsequenceTier();
assert(['compromised', 'compromised_standoff'].includes(tier.key), `低筹码接牌应留下把柄，实际 ${JSON.stringify(tier)}`);
assert(E.getFlag('fu_offer_compromised') || E.getFlag('fu_offer_compromised_standoff'), '接牌被拿捏应留下对应后果标记');

if (errors.length) {
  console.error('Fu private offer consequence smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Fu private offer consequence smoke passed.');