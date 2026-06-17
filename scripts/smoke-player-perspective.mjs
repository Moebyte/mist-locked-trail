#!/usr/bin/env node
import { loadStoryRuntime } from './story-harness.mjs';

const h = loadStoryRuntime();
const { E, nodes } = h;
const errors = [];
const reports = [];

function fail(message) {
  errors.push(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function reset(overrides = {}) {
  h.resetState(overrides);
}

function textOf(id) {
  const node = nodes[id];
  if (!node) throw new Error(`缺少节点：${id}`);
  h.renderNode(id);
  return typeof node.text === 'function' ? node.text(E.state) : (node.text || '');
}

function assertIncludes(text, fragment, label) {
  assert(text.includes(fragment), `${label} 应包含：${fragment}`);
}

function assertNotIncludes(text, fragment, label) {
  assert(!text.includes(fragment), `${label} 不应提前出现：${fragment}`);
}

try {
  reset();
  const weirdFresh = textOf('ch3_school_weird');
  assertIncludes(weirdFresh, '一个此前没有出现在你案卷里的名字', '未触发沈玉兰线的学校异常文本');
  assertNotIncludes(weirdFresh, '沈玉兰的妹妹', '未触发沈玉兰线的学校异常文本');
  assertNotIncludes(weirdFresh, '沈玉兰说过', '未触发沈玉兰线的学校异常文本');
  reports.push('PASS 未触发沈玉兰线时，不提前暴露沈玉芳关系');

  reset({
    flags: { talked_to_woman: true },
    clues: [{ name: '沈玉兰的妹妹', desc: '也失踪了，两个月前；她雇了赵姓男子调查' }],
  });
  const weirdPartial = textOf('ch3_school_weird');
  assertIncludes(weirdPartial, '第一次从吴校长口中听到这个名字：沈玉芳', '只见过沈玉兰但未问出姓名的学校异常文本');
  assertNotIncludes(weirdPartial, '沈玉芳——沈玉兰的妹妹', '只见过沈玉兰但未问出姓名的学校异常文本');
  reports.push('PASS 只见过沈玉兰时，沈玉芳姓名由吴校长首次说出');

  reset({
    flags: { talked_to_woman: true, sister_case: true },
    clues: [{ name: '沈玉芳', desc: '光华小学教师，两个月前失踪' }],
  });
  const weirdKnown = textOf('ch3_school_weird');
  assertIncludes(weirdKnown, '沈玉芳——沈玉兰的妹妹', '已触发沈玉兰详细线的学校异常文本');
  reports.push('PASS 已触发沈玉兰详细线时，允许显示姐妹关系');

  reset();
  const office = textOf('ch3_school_office');
  assertIncludes(office, '陈明远、苏晚亭和陆小姐站在光华小学门前', '陈老师办公室三人合影文本');
  assertNotIncludes(office, '你在茶楼见过', '陈老师办公室三人合影文本');
  assertNotIncludes(office, '沈玉兰', '陈老师办公室三人合影文本');
  reports.push('PASS 陈老师办公室三人合影不再误指沈玉兰或茶楼支线');
} catch (err) {
  fail(err.message);
}

console.log('Player perspective smoke reports:');
for (const report of reports) console.log(`- ${report}`);

if (errors.length) {
  console.error('\nPlayer perspective smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Player perspective smoke passed: ${reports.length} checks.`);
