#!/usr/bin/env node
import { loadStoryRuntime } from './story-harness.mjs';

const h = loadStoryRuntime();
const { E } = h;
const errors = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function reset(flags = {}, clues = [], items = []) {
  h.resetState({
    flags,
    clues,
    items,
    pressure: { heat: 0, deadline: { day: 2, hour: 23, minute: 0 } },
    inGameTime: { day: 2, hour: 22, minute: 20 },
  });
}

function runChoice(textFragment) {
  const choices = h.choicesOf('ch4_dock_exit_assess');
  const choice = choices.find(c => (c.text || c.fogText || '').includes(textFragment));
  assert(choice, `找不到选项：${textFragment}`);
  if (!choice) return null;
  if (typeof choice.effect === 'function') choice.effect(E.state);
  return typeof choice.goto === 'function' ? choice.goto(E.state) : choice.goto;
}

function dock() {
  const tier = E.dockExitRiskTier();
  return {
    tension: E.dockExitTensionScore(),
    control: E.dockExitControlScore(),
    crisis: E.dockExitCrisisScore(),
    tier: tier.key,
  };
}

function hospital() {
  const tier = E.hospitalOutcomeTier();
  return {
    pressure: E.hospitalPressureScore(),
    control: E.hospitalControlScore(),
    crisis: E.hospitalCrisisScore(),
    witness: E.witnessStabilityScore(),
    tier: tier.key,
  };
}

const hardClues = [{ name: '公董局公文纸', desc: '' }, { name: '教具箱走私', desc: '' }];
const hardItems = [{ name: '清场指令', desc: '' }, { name: '光华货运单', desc: '' }];

// 1) 无支援 + 单证人 + 当面质问，不靠硬跳，而是由 crisis 自然引爆。
reset({ found_yufang: true }, hardClues, hardItems);
let goto = runChoice('当场质问傅启元');
let d = dock();
assert(d.tier === 'lethal', `无支援单证人硬质问应为 lethal，实际 ${JSON.stringify(d)}`);
assert(goto === 'end_dock_silenced', `无支援单证人硬质问应由危机值进入灭口，实际 ${goto}`);

// 2) 无支援 + 双证人 + 当面质问，更应该由 crisis 引爆。
reset({ found_yufang: true, found_su_at_dock: true }, hardClues, hardItems);
goto = runChoice('当场质问傅启元');
d = dock();
assert(d.tier === 'lethal', `无支援双证人硬质问应为 lethal，实际 ${JSON.stringify(d)}`);
assert(goto === 'end_dock_silenced', `无支援双证人硬质问应由危机值进入灭口，实际 ${goto}`);

// 3) 无支援 + 双证人 + 借雾撤离，进入医院且初始为可控。
reset({ found_yufang: true, found_su_at_dock: true }, hardClues, hardItems);
goto = runChoice('借雾绕开汽车');
d = dock();
let hosp = hospital();
assert(goto === 'ch4_dock_escape_finish', `无支援双证人借雾撤离应进入医院前置，实际 ${goto}`);
assert(d.tier === 'controlled', `无支援双证人借雾撤离码头应可控，实际 ${JSON.stringify(d)}`);
assert(hosp.tier === 'controlled', `无支援双证人借雾撤离后医院初始应可控，实际 ${JSON.stringify(hosp)}`);

// 4) 老孙带队潜入结果只应按单证人医院路径穷举：正面卡车道压傅启元，码头被压住，但医院需要保护证人。
reset({
  found_yufang: true,
  sun_wait_support: true,
  dock_full_support_entry: true,
  dock_blockade_record: true,
  dock_sun_outer_quiet: true,
  dock_sun_block_truck_lane: true,
}, hardClues, hardItems);
goto = runChoice('先卡住车道和巷口');
d = dock();
hosp = hospital();
assert(!E.getFlag('found_su_at_dock') && !E.getFlag('rescued_su'), '老孙带队穷举不应包含双证人状态');
assert(goto === 'ch4_fu_confront', `老孙卡车道正面压制应进入傅启元对质，实际 ${goto}`);
assert(d.tier === 'controlled', `老孙卡车道正面压制码头应被压住，实际 ${JSON.stringify(d)}`);
assert(hosp.tier === 'unstable', `老孙单证人正面压制后，未保护证人前医院应偏不稳，实际 ${JSON.stringify(hosp)}`);

// 5) 老孙带队趁乱撤离：只单证人，码头安全，但医院因公董局介入保持紧张。
reset({
  found_yufang: true,
  sun_wait_support: true,
  dock_full_support_entry: true,
  dock_blockade_record: true,
}, hardClues, hardItems);
goto = runChoice('趁老孙和公董局纠缠');
d = dock();
hosp = hospital();
assert(!E.getFlag('found_su_at_dock') && !E.getFlag('rescued_su'), '老孙趁乱撤离穷举不应包含双证人状态');
assert(goto === 'ch4_dock_escape_finish', `老孙趁乱撤离应进入医院前置，实际 ${goto}`);
assert(d.tier === 'controlled', `老孙趁乱撤离码头仍应可控，实际 ${JSON.stringify(d)}`);
assert(hosp.tier === 'tense', `老孙趁乱撤离后医院应紧张，实际 ${JSON.stringify(hosp)}`);

if (errors.length) {
  console.error('Dock exit hospital crisis smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Dock exit hospital crisis smoke passed.');
