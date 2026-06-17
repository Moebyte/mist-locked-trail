#!/usr/bin/env node
import { loadStoryRuntime } from './story-harness.mjs';

const h = loadStoryRuntime();
const { E } = h;
const errors = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function reset(overrides = {}) {
  h.resetState(overrides);
}

function noExactClock(label) {
  return !/\d+时\d+分/.test(label) && !/\d+小时/.test(label) && !/\d+分/.test(label);
}

const cases = [
  { scene: 'ch1_open', expect: '尚未入夜' },
  { scene: 'ch2_university', expect: '时间尚宽' },
  { scene: 'ch2_building_enter', expect: '暮色压低' },
  { scene: 'ch3_school', expect: '夜色渐深' },
  { scene: 'ch4_conclusion', expect: '夜色已深' },
  { scene: 'ch4_suzhou_creek', expect: '夜色正深' },
];

for (const c of cases) {
  reset({ currentScene: c.scene });
  const label = E.narrativeClockLabel();
  assert(label === c.expect, `${c.scene} 预期 ${c.expect}，实际 ${label}`);
  assert(noExactClock(label), `${c.scene} 不应显示精确小时/分钟：${label}`);
}

reset({ currentScene: 'ch4_suzhou_creek', pressure: { heat: 8, deadline: { day: 2, hour: 23, minute: 0 } } });
E.setTime(2, 21, 0);
let label = E.narrativeClockLabel();
assert(label === '只够救人' || label === '风声很紧' || label === '夜色紧迫', `高压福生仓应显示叙事压力，实际 ${label}`);
assert(noExactClock(label), `高压福生仓不应显示精确小时/分钟：${label}`);

reset({ currentScene: 'ch4_conclusion', flags: { missed_deadline: true } });
label = E.narrativeClockLabel();
assert(label === '迟到一步', `missed_deadline 应显示迟到一步，实际 ${label}`);

if (errors.length) {
  console.error('Narrative clock smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Narrative clock smoke passed.');
