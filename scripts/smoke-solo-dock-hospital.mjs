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
  return rt.choicesOf(id);
}

function texts(id) {
  return choices(id).map(choice => choice.text || choice.fogText || '');
}

const dockEvidence = [
  { name: '清场指令', desc: '' },
  { name: '光华货运单', desc: '' },
];

reset({
  flags: {},
  items: dockEvidence,
  pressure: { heat: 0, deadline: { day: 2, hour: 23, minute: 0 } },
});
assert(E.routeDockByPressure() === 'ch4_dock_solo_infiltration', `无支援应进入孤身潜入，实际 ${E.routeDockByPressure()}`);
let t = texts('ch4_dock_solo_infiltration');
assert(t.some(text => text.includes('先看清守卫巡灯')), '孤身潜入应先进入东窗巡灯判断');

let c = choices('ch4_dock_solo_window_crisis');
assert(c.some(choice => (choice.text || '').includes('等巡灯')), 'solo 东窗应提供等待巡灯选项');
assert(c.some(choice => (choice.text || '').includes('油布')), 'solo 东窗应提供油布遮影选项');
assert(c.some(choice => (choice.text || '').includes('直接翻进仓库')), 'solo 东窗应提供冒险直接进入选项');

let wait = c.find(choice => (choice.text || '').includes('等巡灯'));
wait?.effect?.(E.state);
assert(E.getFlag('dock_solo_waited_patrol'), '等待巡灯应设置 dock_solo_waited_patrol');
assert(E.dockDelayScore() === 1, `等待巡灯应增加 solo 拖延，实际 ${E.dockDelayScore()}`);

reset({
  flags: { dock_solo_entry: true, found_su_at_dock: true, found_yufang: true },
  items: dockEvidence,
  pressure: { heat: 0, deadline: { day: 2, hour: 23, minute: 0 } },
});
c = choices('ch4_dock_exit_assess');
t = c.map(choice => choice.text || '');
assert(t.some(text => text.includes('水边栈道')), 'solo 撤退应提供水边栈道撤离');
assert(t.some(text => text.includes('空木箱')), 'solo 撤退应提供空木箱遮灯');
assert(t.some(text => text.includes('自己引开视线')), 'solo 撤退应提供自己引开视线');
assert(t.some(text => text.includes('车灯前')), 'solo 撤退应保留车灯前亮证据高风险选项');

const waterline = c.find(choice => (choice.text || '').includes('水边栈道'));
waterline?.effect?.(E.state);
assert(E.getFlag('dock_solo_waterline_escape'), '水边栈道撤离应设置 dock_solo_waterline_escape');
assert(waterline?.goto === 'ch4_dock_escape_finish', '水边栈道撤离应接回成功逃离码头节点');
assert(E.dockExitRiskTier().key !== 'lethal', `水边栈道撤离不应触发码头灭口，实际 ${JSON.stringify(E.dockExitRiskTier())}`);

reset({
  flags: { dock_solo_entry: true, found_su_at_dock: true, found_yufang: true },
  items: dockEvidence,
  pressure: { heat: 0, deadline: { day: 2, hour: 23, minute: 0 } },
});
c = choices('ch4_dock_exit_assess');
const hard = c.find(choice => (choice.text || '').includes('车灯前'));
hard?.effect?.(E.state);
assert(E.getFlag('dock_solo_hard_confront'), 'solo 亮证据应设置 dock_solo_hard_confront');
assert(E.dockExitRiskTier().key === 'lethal', `solo 车灯前亮证据应触发 lethal，实际 ${JSON.stringify(E.dockExitRiskTier())}`);
assert(hard?.goto?.(E.state) === 'end_dock_silenced', 'solo 车灯前亮证据应进入码头灭口');

reset({
  flags: {
    dock_solo_entry: true,
    dock_solo_waterline_escape: true,
    rescued_yufang: true,
    rescued_su: true,
    found_su_at_dock: true,
  },
  items: dockEvidence,
  pressure: { heat: 0, deadline: { day: 2, hour: 23, minute: 0 } },
});
c = choices('ch4_hospital_triage');
t = c.map(choice => choice.text || '');
assert(t.some(text => text.includes('值夜护士锁住后门')), 'solo 医院后门应提供护士锁后门选项');
assert(!t.some(text => text.includes('便衣或老孙的人守住医院后门')), 'solo 医院后门不应显示便衣/老孙守门');
const lock = c.find(choice => (choice.text || '').includes('值夜护士锁住后门'));
const beforePressure = E.hospitalPressureScore();
const beforeControl = E.hospitalControlScore();
lock?.effect?.(E.state);
assert(E.getFlag('hospital_triage_solo_lock_backdoor'), '护士锁后门应设置 hospital_triage_solo_lock_backdoor');
assert(E.hospitalPressureScore() <= beforePressure, '护士锁后门不应增加医院压力');
assert(E.hospitalControlScore() > beforeControl, '护士锁后门应增加医院控场');

if (errors.length) {
  console.error('Solo dock hospital smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Solo dock hospital smoke passed.');
