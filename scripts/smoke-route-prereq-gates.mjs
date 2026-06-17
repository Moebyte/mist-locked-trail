#!/usr/bin/env node
import { loadStoryRuntime } from './story-harness.mjs';

const reports = [];
const errors = [];

function test(name, fn) {
  try {
    fn();
    reports.push(`PASS ${name}`);
  } catch (err) {
    errors.push(`${name}: ${err.message}`);
  }
}

function runtime(initialState = {}) {
  return loadStoryRuntime({ initialState });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function choiceTexts(rt, sceneId) {
  return rt.choicesOf(sceneId).map(choice => choice.text || choice.fogText || '');
}

function isLocked(choice, state) {
  return typeof choice.when === 'function' && !choice.when(state);
}

function schoolCompleteState(extra = {}) {
  return {
    flags: {
      asked_about_chen: true,
      chen_su_link: true,
      got_chen_evidence: true,
      read_letter: true,
      ...extra.flags,
    },
    clues: [
      { name: '陈老师与女子争吵', desc: '测试占位' },
      ...(extra.clues || []),
    ],
    items: extra.items || [],
    inGameTime: extra.inGameTime || { day: 2, hour: 12, minute: 0 },
  };
}

test('只去苏家后，只能回大学或巡捕房，不能直接去薛华立路', () => {
  const rt = runtime({
    flags: { asked_photo: true },
    clues: [{ name: '母亲证词', desc: '测试占位' }],
  });
  const texts = choiceTexts(rt, 'ch2_leave_home');
  assert(texts.some(text => text.includes('圣约翰大学')), '苏家后应能去大学');
  assert(texts.some(text => text.includes('巡捕房')), '苏家后应能去巡捕房');
  assert(!texts.some(text => text.includes('薛华立路') || text.includes('法租界')), '只去苏家后不应直接开启薛华立路');
});

test('没有王巡官纸条时，线索整理中的福生仓入口锁死', () => {
  const rt = runtime(schoolCompleteState());
  const choices = rt.choicesOf('ch3_wrapup');
  const fushengChoices = choices.filter(choice => (choice.text || choice.fogText || '').includes('福生仓'));
  assert(fushengChoices.length >= 1, '应显示福生仓入口提示');
  assert(fushengChoices.every(choice => isLocked(choice, rt.E.state)), '没有王巡官纸条时福生仓入口必须锁死');
  assert(fushengChoices.some(choice => (choice.fogText || '').includes('王巡官纸条')), '锁死提示应说明需要王巡官纸条');
});

test('拿到王巡官纸条后，福生仓入口解锁', () => {
  const rt = runtime(schoolCompleteState({
    flags: { got_wang_note: true },
    clues: [{ name: '王巡官遗留纸条', desc: '光华夜值；福生仓，三日清；别信公董局来的电话' }],
    items: [{ name: '半张烟盒纸', desc: '王巡官留下的纸条' }],
  }));
  const choices = rt.choicesOf('ch3_wrapup');
  const active = choices.find(choice => choice.goto === 'ch4_suzhou_creek' && !isLocked(choice, rt.E.state));
  assert(active, '拿到王巡官纸条后应能去福生仓');
});

test('强行进入苏州河但没有王巡官纸条时，只能回巡捕房', () => {
  const rt = runtime();
  const node = rt.renderNode('ch4_suzhou_creek');
  const text = typeof node.text === 'function' ? node.text(rt.E.state) : node.text;
  const texts = choiceTexts(rt, 'ch4_suzhou_creek');
  assert(text.includes('福生仓，三日清'), '强行进入时应说明缺少王巡官纸条');
  assert(texts.some(choice => choice.includes('巡捕房')), '强行进入时应引导回巡捕房');
  assert(!texts.some(choice => choice.includes('潜入') || choice.includes('后门')), '没有王巡官纸条时不应出现潜入/后门选项');
});

test('巡捕房路线可进福生仓，但没走沈玉芳线时找不到暗室', () => {
  const rt = runtime({
    flags: { got_wang_note: true },
    clues: [{ name: '王巡官遗留纸条', desc: '测试占位' }],
    items: [{ name: '半张烟盒纸', desc: '测试占位' }],
    inGameTime: { day: 2, hour: 12, minute: 0 },
  });
  assert(rt.E.routeDockByPressure() !== 'ch4_fusheng_locked_by_wang', '有王巡官纸条时应能进入福生仓');
  assert(rt.E.routeDockDeepByPressure() === 'ch4_dock_no_darkroom', '没有沈玉芳线时不应找到暗室');

  const searchNode = rt.renderNode('ch4_dock_full_search');
  const searchText = typeof searchNode.text === 'function' ? searchNode.text(rt.E.state) : searchNode.text;
  const searchChoices = choiceTexts(rt, 'ch4_dock_full_search');
  assert(searchText.includes('没有听见敲击声'), '没有沈玉芳线时不应听见敲击声');
  assert(!searchChoices.some(text => text.includes('声音来源') || text.includes('暗门')), '没有沈玉芳线时不应出现声音来源/暗门选项');

  rt.renderNode('ch4_dock_no_darkroom');
  assert(!rt.E.getFlag('rescued_yufang'), '搜查断线时不应设置 rescued_yufang');
  assert(!rt.E.getFlag('found_yufang'), '搜查断线时不应设置 found_yufang');
});

test('大学薛华立路线加巡捕房纸条齐全时，可以正常施救', () => {
  const rt = runtime({
    flags: { got_wang_note: true, sister_case: true },
    clues: [
      { name: '王巡官遗留纸条', desc: '测试占位' },
      { name: '沈玉芳', desc: '光华小学教师，两个月前失踪' },
      { name: '沈玉芳与陈明远', desc: '测试占位' },
    ],
    items: [{ name: '半张烟盒纸', desc: '测试占位' }],
    inGameTime: { day: 2, hour: 12, minute: 0 },
  });
  assert(rt.E.routeDockDeepByPressure() === 'ch4_dock_deep_dual', '王巡官纸条与沈玉芳线齐全时应进入正常暗室救人路线');
});

console.log('Route prerequisite gate smoke reports:');
for (const report of reports) console.log(`- ${report}`);

if (errors.length) {
  console.error('\nRoute prerequisite gate smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Route prerequisite gate smoke passed: ${reports.length} checks.`);
