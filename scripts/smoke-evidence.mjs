#!/usr/bin/env node
import { loadStoryRuntime } from './story-harness.mjs';

const errors = [];
const reports = [];
const h = loadStoryRuntime();
const { E } = h;

function smokePresent(name, sceneId, itemName, expectedGoto, expectations = []) {
  h.resetState({
    flags: { found_su_at_dock: true, sun_support_available: true, sun_fast_support: true },
    items: [{ name: itemName, desc: '' }],
  });

  try {
    const result = h.present(sceneId, itemName);
    if (!result || result.goto !== expectedGoto) {
      throw new Error(`${sceneId} 出示 ${itemName} 预期跳到 ${expectedGoto}，实际 ${result ? result.goto : 'null'}`);
    }
    h.assertNode(result.goto);
    h.renderNode(result.goto);
    for (const check of expectations) check();
    reports.push(`PASS ${name}: ${sceneId} + ${itemName} -> ${expectedGoto}`);
  } catch (err) {
    errors.push(`${name}: ${err.message}`);
  }
}

function expectFlag(flag, value = true) {
  return () => h.assertFlag(flag, value);
}

function expectClue(name) {
  return () => h.assertClue(name);
}

smokePresent('傅启元举证：福生仓地址', 'ch4_fu_confront', '福生仓地址', 'ch4_fu_present_address', [
  expectClue('傅启元与福生仓'),
]);
smokePresent('傅启元举证：光华货运单', 'ch4_fu_confront', '光华货运单', 'ch4_fu_present_waybill', [
  expectFlag('fu_waybill_exposed'),
  expectClue('傅启元货运单破绽'),
]);
smokePresent('傅启元举证：清场指令', 'ch4_fu_confront', '清场指令', 'ch4_fu_present_clearance', [
  expectFlag('fu_clearance_exposed'),
  expectClue('傅启元清场指令破绽'),
]);
smokePresent('沈玉芳双人获救举证：三人合影', 'ch4_dock_who_dual', '三人合影', 'ch4_yufang_present_photo_dual', [
  expectClue('沈玉芳认出三人合影'),
]);
smokePresent('沈玉芳双人获救举证：陈明远的信', 'ch4_dock_who_dual', '陈明远的信', 'ch4_yufang_present_letter_dual', [
  expectClue('沈玉芳确认陈明远求助'),
]);
smokePresent('沈玉芳双人获救举证：日记残页', 'ch4_dock_who_dual', '日记残页', 'ch4_yufang_present_diary_dual', [
  expectClue('沈玉芳读到苏晚亭日记'),
]);

console.log('Evidence smoke reports:');
for (const report of reports) console.log(`- ${report}`);

if (errors.length) {
  console.error('\nEvidence smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Evidence smoke passed: ${reports.length} interactions.`);
