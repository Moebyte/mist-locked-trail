#!/usr/bin/env node
import { loadStoryRuntime } from './story-harness.mjs';

const errors = [];
const reports = [];
const h = loadStoryRuntime();

function smokePresent(name, sceneId, itemName, expectedGoto, expectations = []) {
  h.resetState({ items: [{ name: itemName, desc: '' }] });

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

smokePresent('老孙支援举证：卷宗摘抄', 'ch4_sun_support', '卷宗摘抄', 'ch4_sun_present_casefile', [
  expectFlag('sun_casefile_alerted'),
  expectClue('老孙确认卷宗异常'),
]);
smokePresent('老孙支援举证：清场指令', 'ch4_sun_support', '清场指令', 'ch4_sun_present_clearance', [
  expectFlag('sun_support_available'),
  expectFlag('sun_clearance_convinced'),
  expectClue('老孙被清场指令说服'),
]);
smokePresent('老孙支援举证：光华货运单', 'ch4_sun_support', '光华货运单', 'ch4_sun_present_waybill', [
  expectFlag('sun_support_available'),
  expectFlag('sun_waybill_convinced'),
  expectClue('老孙确认货运链'),
]);
smokePresent('周明远情感举证：日记残页', 'ch4_revisit_zhou', '日记残页', 'ch4_zhou_present_diary', [
  expectFlag('zhou_understands_wanting'),
  expectClue('周明远理解苏晚亭选择'),
]);
smokePresent('周明远情感举证：陈明远的信', 'ch4_revisit_zhou', '陈明远的信', 'ch4_zhou_present_letter', [
  expectFlag('zhou_accepts_chen_link'),
  expectClue('周明远面对陈明远的信'),
]);
smokePresent('周明远情感举证：三人合影', 'ch4_revisit_zhou', '三人合影', 'ch4_zhou_present_photo', [
  expectFlag('zhou_recognizes_guanghua_photo'),
  expectClue('周明远认出光华合影'),
]);

console.log('Evidence polish smoke reports:');
for (const report of reports) console.log(`- ${report}`);

if (errors.length) {
  console.error('\nEvidence polish smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Evidence polish smoke passed: ${reports.length} interactions.`);
