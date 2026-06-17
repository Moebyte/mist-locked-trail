#!/usr/bin/env node
import { loadStoryRuntime } from './story-harness.mjs';

const errors = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function runtime(initialState = {}) {
  return loadStoryRuntime({ initialState });
}

function runEscape(initialState) {
  const rt = runtime(initialState);
  rt.renderNode('ch4_dock_escape_finish');
  return rt;
}

const withoutHome = runEscape({
  flags: { found_su_at_dock: true },
});
assert(withoutHome.E.getFlag('rescued_yufang'), '无苏家凭据时仍应救出沈玉芳');
assert(!withoutHome.E.getFlag('rescued_su'), '无苏家凭据时不应设置 rescued_su');
assert(withoutHome.E.getFlag('su_rescue_failed_no_home_trust'), '无苏家凭据时应记录苏晚亭救援信任失败');
assert(withoutHome.E.getFlag('su_moved_from_dock'), '无苏家凭据时应降档为苏晚亭被转走/失之交臂');
const withoutHomeText = withoutHome.nodes.ch4_dock_escape_finish.text();
assert(withoutHomeText.includes('向苏母出示') || withoutHomeText.includes('把那张苏晚亭的照片拿给苏母看'), '无苏家凭据时应说明缺少向苏母出示照片这一步');

const withOnlyHomeTalk = runEscape({
  flags: { found_su_at_dock: true, asked_photo: true, asked_mother_photo: true },
  clues: [{ name: '母亲证词', desc: '' }, { name: '表哥', desc: '' }, { name: '裁切的照片', desc: '' }],
});
assert(!withOnlyHomeTalk.E.getFlag('rescued_su'), '只问苏母/看墙上照片/问表哥，不应替代向苏母出示照片');
assert(withOnlyHomeTalk.E.getFlag('su_rescue_failed_no_home_trust'), '没有向苏母出示照片时，应仍然触发信任失败');

const withMotherPhoto = runEscape({
  flags: { found_su_at_dock: true, shown_photo_to_mother: true },
  clues: [{ name: '苏母认出照片', desc: '' }],
});
assert(withMotherPhoto.E.getFlag('rescued_yufang'), '有苏家凭据时应救出沈玉芳');
assert(withMotherPhoto.E.getFlag('rescued_su'), '有苏家凭据时应设置 rescued_su');
assert(!withMotherPhoto.E.getFlag('su_rescue_failed_no_home_trust'), '有苏家凭据时不应记录信任失败');
const withHomeText = withMotherPhoto.nodes.ch4_dock_escape_finish.text();
assert(withHomeText.includes('苏晚亭靠在你脱下来的大衣里'), '有苏家凭据时应走苏晚亭获救文本');

const dualWithoutHome = runtime({ flags: { found_su_at_dock: true } });
const dualText = dualWithoutHome.nodes.ch4_dock_who_dual.text();
assert(dualText.includes('没有苏母认出照片后的托付凭据'), '暗室见到苏晚亭但无苏母托付凭据时，应提前提示信任不足');

const dualWithHome = runtime({ flags: { found_su_at_dock: true, shown_photo_to_mother: true }, clues: [{ name: '苏母认出照片', desc: '' }] });
const dualHomeText = dualWithHome.nodes.ch4_dock_who_dual.text();
assert(dualHomeText.includes('苏母认出那张照片'), '暗室见到苏晚亭且有苏家凭据时，应提示信任建立');

if (errors.length) {
  console.error('Su home trust gate smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Su home trust gate smoke passed.');
