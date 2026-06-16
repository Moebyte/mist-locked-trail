#!/usr/bin/env node
import { loadStoryRuntime } from './story-harness.mjs';

const errors = [];
const reports = [];
const h = loadStoryRuntime();
const { E } = h;

function basePressure() {
  return { heat: 0, deadline: { day: 2, hour: 23, minute: 0 } };
}

function play(name, initialState, steps) {
  h.resetState(initialState);
  const visited = [];

  try {
    for (const step of steps) {
      if (typeof step === 'string') {
        h.renderNode(step);
        visited.push(step);
        continue;
      }

      if (step.setTime) {
        E.state.inGameTime = { ...step.setTime };
        continue;
      }

      if (step.expectRoute) {
        const actual = step.fn();
        if (actual !== step.expectRoute) throw new Error(`${step.label} 预期 ${step.expectRoute}，实际 ${actual}`);
        h.renderNode(actual);
        visited.push(actual);
        continue;
      }

      if (step.goto) {
        h.goByTarget(step.goto);
        visited.push(E.state.currentScene);
        continue;
      }

      if (step.expect) {
        step.expect();
        continue;
      }

      throw new Error(`未知步骤：${JSON.stringify(step)}`);
    }

    reports.push({ name, visited, flags: { ...E.state.flags } });
  } catch (err) {
    errors.push(`${name}: ${err.message}\n  visited: ${visited.join(' -> ')}`);
  }
}

function expectFlag(flag, value = true) {
  return () => h.assertFlag(flag, value);
}

function expectItem(name) {
  return () => h.assertItem(name);
}

function expectClue(name) {
  return () => h.assertClue(name);
}

function expectSceneContains(id) {
  return () => h.assertSceneContains(id);
}

play('早到路线：完整搜证并救出苏晚亭和沈玉芳',
  { inGameTime: { day: 1, hour: 14, minute: 30 }, pressure: basePressure() },
  [
    'ch4_suzhou_creek',
    { expectRoute: 'ch4_dock_full_search', label: 'safe routeDockByPressure', fn: () => E.routeDockByPressure() },
    { goto: 'ch4_dock_crates' },
    { goto: 'ch4_dock_hide' },
    { goto: 'ch4_dock_locked_door' },
    { expectRoute: 'ch4_dock_deep_dual', label: 'safe routeDockDeepByPressure', fn: () => E.routeDockDeepByPressure() },
    { goto: 'ch4_dock_who_dual' },
    { goto: 'ch4_dock_escape' },
    { goto: 'ch4_dock_escape_finish' },
    { expect: expectFlag('rescued_su') },
    { expect: expectFlag('rescued_yufang') },
    { expect: expectFlag('found_su_at_dock') },
    { expect: expectItem('光华货运单') },
    { expect: expectClue('苏晚亭在场') },
  ]
);

play('晚到路线：有限搜查，只救沈玉芳并发现苏晚亭刚被转走',
  { inGameTime: { day: 2, hour: 14, minute: 0 }, pressure: basePressure() },
  [
    'ch4_suzhou_creek',
    { expectRoute: 'ch4_dock_limited_search', label: 'tight routeDockByPressure', fn: () => E.routeDockByPressure() },
    { goto: 'ch4_dock_locked_door' },
    { expectRoute: 'ch4_dock_deep_trace', label: 'tight routeDockDeepByPressure', fn: () => E.routeDockDeepByPressure() },
    { goto: 'ch4_dock_who' },
    { goto: 'ch4_dock_escape' },
    { goto: 'ch4_dock_escape_finish' },
    { expect: expectFlag('rescued_yufang') },
    { expect: expectFlag('su_moved_from_dock') },
    { expect: expectItem('苏晚亭学生证') },
    { expect: expectClue('苏晚亭曾在暗室') },
  ]
);

play('临界路线：只够救沈玉芳，只拿到苏晚亭手表',
  { inGameTime: { day: 2, hour: 20, minute: 30 }, pressure: basePressure() },
  [
    'ch4_suzhou_creek',
    { expectRoute: 'ch4_dock_rescue_only', label: 'critical routeDockByPressure', fn: () => E.routeDockByPressure() },
    { goto: 'ch4_dock_deep_rescue_only' },
    { goto: 'ch4_dock_who' },
    { goto: 'ch4_dock_escape' },
    { goto: 'ch4_dock_escape_finish' },
    { expect: expectFlag('rescued_yufang') },
    { expect: expectFlag('su_trace_only') },
    { expect: expectItem('苏晚亭手表') },
    { expect: expectClue('苏晚亭手表') },
  ]
);

play('超期路线：福生仓清场，只剩残留字条',
  { inGameTime: { day: 2, hour: 23, minute: 30 }, pressure: basePressure() },
  [
    'ch4_suzhou_creek',
    { expectRoute: 'ch4_dock_cleared', label: 'expired routeDockByPressure', fn: () => E.routeDockByPressure() },
    { expect: expectFlag('missed_deadline') },
    { expect: expectItem('苏晚亭半张字条') },
    { expect: expectClue('福生仓清场') },
  ]
);

play('有老孙支援路线：傅启元对峙不丢失支援逻辑',
  { inGameTime: { day: 2, hour: 14, minute: 0 }, pressure: basePressure(), flags: { sun_support_available: true, sun_fast_support: true, found_su_at_dock: true } },
  [
    'ch4_dock_escape',
    { goto: 'ch4_fu_confront' },
    { goto: 'ch4_dock_escape_finish' },
    { expect: expectFlag('confronted_fu') },
    { expect: expectFlag('rescued_su') },
    { expect: expectSceneContains('ch4_fu_confront') },
  ]
);

play('无老孙支援路线：傅启元对峙后仍可撤走',
  { inGameTime: { day: 2, hour: 14, minute: 0 }, pressure: basePressure(), flags: { found_su_at_dock: true } },
  [
    'ch4_dock_escape',
    { goto: 'ch4_fu_confront' },
    { goto: 'ch4_dock_escape_finish' },
    { expect: expectFlag('confronted_fu') },
    { expect: expectFlag('rescued_su') },
    { expect: expectSceneContains('ch4_fu_confront') },
  ]
);

console.log('Route smoke reports:');
for (const report of reports) {
  console.log(`- PASS ${report.name}: ${report.visited.join(' -> ')}`);
}

if (errors.length) {
  console.error('\nRoute smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Route smoke passed: ${reports.length} routes.`);
