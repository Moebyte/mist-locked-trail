#!/usr/bin/env node
import { loadStoryRuntime } from './story-harness.mjs';

const rt = loadStoryRuntime();
const { E } = rt;
const errors = [];

function assert(condition, message) { if (!condition) errors.push(message); }
function clue(name, desc = '') { E.addClue(name, desc); }
function item(name, desc = '') { E.addItem(name, desc); }
function flag(name, value = true) { E.setFlag(name, value); }
function heat(value) { E.addHeat(value); }
function seedDockPrereqs() {
  flag('got_wang_note');
  flag('sister_case');
  item('半张烟盒纸');
  clue('王巡官遗留纸条');
  clue('沈玉芳');
  clue('沈玉兰的妹妹');
  clue('沈玉芳与陈明远');
}
function dockSetup(setup) {
  return () => {
    seedDockPrereqs();
    setup?.();
  };
}
function choices(id) { rt.renderNode(id); return rt.choicesOf(id); }
function hasTarget(list, target) { return list.some(choice => choice.goto === target); }
function hasText(list, fragment) { return list.some(choice => choice.text && choice.text.includes(fragment)); }
function labelList(list) { return list.map(choice => `${choice.text} -> ${typeof choice.goto === 'function' ? '[dynamic goto]' : choice.goto}`).join(' | '); }
function expectTarget(id, target, expected, setup, message) {
  rt.resetState();
  setup?.();
  const list = choices(id);
  const actual = hasTarget(list, target);
  assert(actual === expected, `${message}\n  ${id} choices: ${actual === expected ? '[omitted]' : labelList(list)}`);
}
function expectText(id, fragment, expected, setup, message) {
  rt.resetState();
  setup?.();
  const list = choices(id);
  const actual = hasText(list, fragment);
  assert(actual === expected, `${message}\n  ${id} choices: ${actual === expected ? '[omitted]' : labelList(list)}`);
}
function expectRoute(fnName, expected, setup, message) {
  rt.resetState();
  setup?.();
  const actual = E[fnName]();
  assert(actual === expected, `${message}\n  ${fnName} returned: ${actual}, expected: ${expected}`);
}

const university = 'ch2_university';
const door = ['ch2', 'univ', 'door'].join('_');
const matron = ['ch2', 'univ', 'matron'].join('_');
const paper = ['ch2', 'univ', 'paper'].join('_');
const leaveUniversity = ['ch2', 'leave', 'univ'].join('_');
const askedDoor = ['asked', 'door'].join('_');

expectTarget(university, door, false, () => flag(askedDoor), '圣约翰大学：问过门房后不应再次显示门房入口');
expectTarget(university, matron, false, () => clue('舍监证词'), '圣约翰大学：问过舍监后不应再次显示舍监入口');
expectTarget(university, paper, false, () => clue('法租界地图'), '圣约翰大学：查过论文草稿后不应再次显示论文入口');
expectTarget(university, leaveUniversity, false, () => { flag(askedDoor); clue('法租界地图'); }, '圣约翰大学：缺少舍监证词时不应离开大学');
expectTarget(university, leaveUniversity, true, () => { flag(askedDoor); clue('舍监证词'); clue('法租界地图'); }, '圣约翰大学：三条调查线完成后应开放离开大学');
expectTarget(matron, paper, false, () => clue('法租界地图'), '圣约翰大学子场景：论文已查后，舍监证词页不应再次显示论文入口');
expectTarget(matron, door, false, () => flag(askedDoor), '圣约翰大学子场景：门房已问后，舍监证词页不应再次显示门房入口');
expectTarget(door, paper, false, () => clue('法租界地图'), '圣约翰大学子场景：论文已查后，门房证词页不应再次显示论文入口');
expectTarget(door, leaveUniversity, true, () => { clue('舍监证词'); clue('法租界地图'); }, '圣约翰大学子场景：从门房证词页完成三条线后，应开放离开大学');

const policeFile = 'ch2_police_file';
const policeAlt = 'ch2_police_alt';
const wang = 'ch2_police_wang';
expectTarget(policeFile, wang, false, null, '巡捕房：未查清福生仓标记前，不应直接追问王巡官纸条');
expectText(policeFile, '王巡官纸条线索未浮出', true, null, '巡捕房：未查清福生仓标记前，应提示王巡官纸条线索未浮出');
expectTarget(policeFile, wang, true, () => clue('福生仓标识'), '巡捕房：老头认出福生仓后，应显示追问王巡官纸条');
expectTarget(policeAlt, wang, true, () => clue('福生仓标识'), '巡捕房返回路线：老头认出福生仓后，应显示追问王巡官纸条');
expectTarget(policeFile, wang, false, () => flag('got_wang_note'), '巡捕房：拿到王巡官纸条后，不应再次追问王巡官');
expectTarget(policeAlt, wang, false, () => flag('got_wang_note'), '巡捕房返回路线：拿到王巡官纸条后，不应再次追问王巡官');

const french = 'ch2_frenchtown';
const stakeout = 'ch2_building_stakeout';
const landlord = 'ch2_ask_landlord';
const roomDoor = 'ch2_203_door';
const roomSearch = 'ch2_203_search';
const school = 'ch3_school';
expectTarget(french, stakeout, false, () => flag('saw_man'), '薛华立路：观察过黑衣男人后，不应再次显示观察入口');
expectTarget('ch2_building_enter', landlord, false, () => flag('asked_landlord'), '永兴贸易商行：问过看门老头后，不应再次显示问老头入口');
expectTarget('ch2_building_enter', roomDoor, false, () => item('三人合影'), '永兴贸易商行：搜完203后，不应再次显示进入203入口');
expectTarget(roomDoor, roomSearch, true, null, '203室：进屋但未仔细搜查时，应显示仔细搜查房间');
expectTarget(roomDoor, roomSearch, false, () => item('三人合影'), '203室：搜完房间后，不应再次显示仔细搜查房间');
expectTarget(roomDoor, school, true, () => item('三人合影'), '203室：搜完房间后，应引导去光华小学');

const teacher = 'ch3_school_teacher';
const yufang = 'ch3_school_yufang';
const chenSu = 'ch3_school_chen_su';
const weird = 'ch3_school_weird';
const office = 'ch3_school_office';
const letter = 'ch3_chen_letter';
const wrapup = 'ch3_wrapup';

expectTarget(school, teacher, false, () => flag('asked_about_chen'), '光华小学：问过陈老师后不应再次显示陈老师入口');
expectTarget(school, chenSu, false, () => { flag('asked_about_chen'); flag('chen_su_link'); }, '光华小学：问过陈老师与苏晚亭关系后不应重复显示该入口');
expectTarget(school, weird, false, () => clue('陈老师与女子争吵'), '光华小学：问过学校异常后不应重复显示异常入口');
expectTarget(school, office, false, () => flag('got_chen_evidence'), '光华小学：看过陈老师办公室后不应重复显示办公室入口');
expectTarget(school, letter, true, () => flag('got_chen_evidence'), '光华小学：拿到办公室证据但未读信时，应显示读信入口');
expectTarget(school, wrapup, false, () => { flag('asked_about_chen'); flag('chen_su_link'); flag('got_chen_evidence'); flag('read_letter'); }, '光华小学：缺少学校异常线索时不应整理线索');
expectTarget(school, yufang, true, () => { flag('sister_case'); flag('asked_about_chen'); flag('chen_su_link'); flag('got_chen_evidence'); flag('read_letter'); clue('陈老师与女子争吵'); }, '光华小学：沈玉芳线已触发但未问完时，应显示沈玉芳入口');
expectTarget(school, wrapup, true, () => { flag('sister_case'); flag('asked_about_chen'); flag('chen_su_link'); flag('got_chen_evidence'); flag('read_letter'); clue('陈老师与女子争吵'); clue('沈玉芳与陈明远'); }, '光华小学：全部调查完成后应开放整理线索');
expectTarget(teacher, weird, false, () => clue('陈老师与女子争吵'), '光华小学子场景：学校异常已问后，陈老师页不应再次显示异常入口');
expectTarget(teacher, office, false, () => flag('got_chen_evidence'), '光华小学子场景：办公室已看后，陈老师页不应再次显示办公室入口');
expectTarget(chenSu, weird, false, () => clue('陈老师与女子争吵'), '光华小学子场景：异常已问后，陈苏关系页不应再次显示异常入口');
expectTarget(weird, office, false, () => flag('got_chen_evidence'), '光华小学子场景：办公室已看后，学校异常页不应再次显示办公室入口');
expectTarget('ch3_wu_present_photo', wrapup, false, () => { flag('asked_about_chen'); }, '光华小学举证页：未完成学校调查时不应直接整理线索');
expectTarget(wrapup, school, true, () => flag('asked_about_chen'), '光华小学：未完成时误入整理线索，应引导返回学校继续调查');

const dockEscape = 'ch4_dock_escape';
expectRoute('routeDockByPressure', 'ch4_dock_full_search', dockSetup(), '福生仓 heat：低风险且时间充裕时，应进入完整搜查');
expectRoute('routeDockByPressure', 'ch4_dock_limited_search', dockSetup(() => heat(4)), '福生仓 heat：heat>=4 应让仓库入口结果下降一档');
expectRoute('routeDockByPressure', 'ch4_dock_rescue_only', dockSetup(() => heat(6)), '福生仓 heat：heat>=6 应让仓库入口结果下降两档');
expectRoute('routeDockDeepByPressure', 'ch4_dock_deep_trace', dockSetup(() => heat(4)), '福生仓 heat：heat>=4 应让暗室结果下降一档');
expectRoute('routeDockDeepByPressure', 'ch4_dock_deep_rescue_only', dockSetup(() => heat(6)), '福生仓 heat：heat>=6 应让暗室结果下降两档');
expectRoute('routeDockByPressure', 'ch4_dock_full_search', dockSetup(() => { heat(4); flag('sun_support_in_action'); }), '福生仓 heat：老孙实际到场时，应抵消一档 heat 压力');
expectText(dockEscape, '老孙的人', false, () => flag('sun_support_available'), '福生仓：老孙只是答应支援但未随行时，不应出现老孙的人亮明身份');
expectText(dockEscape, '老孙的人', true, () => flag('sun_support_in_action'), '福生仓：老孙的人实际到场时，应在码头可用');
expectText(dockEscape, '当场质问傅启元', true, () => flag('sun_support_available'), '福生仓：heat 未升高时，即使老孙未随行，也应保留独自质问傅启元的选项');
expectText(dockEscape, '当场质问傅启元', false, () => heat(4), '福生仓 heat：heat>=4 且无支援时，不应允许独自当场质问傅启元');
expectText(dockEscape, '动静太大', true, () => heat(6), '福生仓 heat：heat>=6 且无支援时，应进入强行撤离选项');
expectText(dockEscape, '借雾', false, () => heat(6), '福生仓 heat：heat>=6 且无支援时，不应还能轻松借雾绕开');

if (errors.length) {
  console.error('\nStateful hub audit failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('Stateful hub audit passed.');
