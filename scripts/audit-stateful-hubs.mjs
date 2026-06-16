#!/usr/bin/env node
import { loadStoryRuntime } from './story-harness.mjs';

const rt = loadStoryRuntime();
const { E } = rt;
const errors = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function clue(name, desc = '') {
  E.addClue(name, desc);
}

function flag(name, value = true) {
  E.setFlag(name, value);
}

function choices(id) {
  rt.renderNode(id);
  return rt.choicesOf(id);
}

function hasTarget(list, target) {
  return list.some(choice => choice.goto === target || (typeof choice.goto === 'function' && choice.goto(E.state) === target));
}

function labelList(list) {
  return list.map(choice => `${choice.text} -> ${typeof choice.goto === 'function' ? choice.goto(E.state) : choice.goto}`).join(' | ');
}

function expectTarget(id, target, expected, setup, message) {
  rt.resetState();
  setup?.();
  const list = choices(id);
  const actual = hasTarget(list, target);
  assert(actual === expected, `${message}\n  ${id} choices: ${labelList(list)}`);
}

const university = 'ch2_university';
const door = ['ch2', 'univ', 'door'].join('_');
const matron = ['ch2', 'univ', 'matron'].join('_');
const paper = ['ch2', 'univ', 'paper'].join('_');
const leaveUniversity = ['ch2', 'leave', 'univ'].join('_');
const askedDoor = ['asked', 'door'].join('_');

expectTarget(university, door, false, () => {
  flag(askedDoor);
}, '圣约翰大学：问过门房后不应再次显示门房入口');

expectTarget(university, matron, false, () => {
  clue('舍监证词');
}, '圣约翰大学：问过舍监后不应再次显示舍监入口');

expectTarget(university, paper, false, () => {
  clue('法租界地图');
}, '圣约翰大学：查过论文草稿后不应再次显示论文入口');

expectTarget(university, leaveUniversity, false, () => {
  flag(askedDoor);
  clue('法租界地图');
}, '圣约翰大学：缺少舍监证词时不应离开大学');

expectTarget(university, leaveUniversity, true, () => {
  flag(askedDoor);
  clue('舍监证词');
  clue('法租界地图');
}, '圣约翰大学：三条调查线完成后应开放离开大学');

expectTarget(matron, paper, false, () => {
  clue('法租界地图');
}, '圣约翰大学子场景：论文已查后，舍监证词页不应再次显示论文入口');

expectTarget(matron, door, false, () => {
  flag(askedDoor);
}, '圣约翰大学子场景：门房已问后，舍监证词页不应再次显示门房入口');

expectTarget(door, paper, false, () => {
  clue('法租界地图');
}, '圣约翰大学子场景：论文已查后，门房证词页不应再次显示论文入口');

expectTarget(door, leaveUniversity, true, () => {
  clue('舍监证词');
  clue('法租界地图');
}, '圣约翰大学子场景：从门房证词页完成三条线后，应开放离开大学');

const school = 'ch3_school';
const teacher = 'ch3_school_teacher';
const yufang = 'ch3_school_yufang';
const chenSu = 'ch3_school_chen_su';
const weird = 'ch3_school_weird';
const office = 'ch3_school_office';
const letter = 'ch3_chen_letter';
const wrapup = 'ch3_wrapup';

expectTarget(school, teacher, false, () => {
  flag('asked_about_chen');
}, '光华小学：问过陈老师后不应再次显示陈老师入口');

expectTarget(school, chenSu, false, () => {
  flag('asked_about_chen');
  flag('chen_su_link');
}, '光华小学：问过陈老师与苏晚亭关系后不应重复显示该入口');

expectTarget(school, weird, false, () => {
  clue('陈老师与女子争吵');
}, '光华小学：问过学校异常后不应重复显示异常入口');

expectTarget(school, office, false, () => {
  flag('got_chen_evidence');
}, '光华小学：看过陈老师办公室后不应重复显示办公室入口');

expectTarget(school, letter, true, () => {
  flag('got_chen_evidence');
}, '光华小学：拿到办公室证据但未读信时，应显示读信入口');

expectTarget(school, wrapup, false, () => {
  flag('asked_about_chen');
  flag('chen_su_link');
  flag('got_chen_evidence');
  flag('read_letter');
}, '光华小学：缺少学校异常线索时不应整理线索');

expectTarget(school, yufang, true, () => {
  flag('sister_case');
  flag('asked_about_chen');
  flag('chen_su_link');
  flag('got_chen_evidence');
  flag('read_letter');
  clue('陈老师与女子争吵');
}, '光华小学：沈玉芳线已触发但未问完时，应显示沈玉芳入口');

expectTarget(school, wrapup, true, () => {
  flag('sister_case');
  flag('asked_about_chen');
  flag('chen_su_link');
  flag('got_chen_evidence');
  flag('read_letter');
  clue('陈老师与女子争吵');
  clue('沈玉芳与陈明远');
}, '光华小学：全部调查完成后应开放整理线索');

expectTarget(wrapup, school, true, () => {
  flag('asked_about_chen');
}, '光华小学：未完成时误入整理线索，应引导返回学校继续调查');

if (errors.length) {
  console.error('\nStateful hub audit failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Stateful hub audit passed.');
