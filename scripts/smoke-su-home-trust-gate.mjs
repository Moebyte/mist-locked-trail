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

function present(rt, sceneId, itemName, desc = '') {
  const scene = rt.renderNode(sceneId);
  return scene.onPresent?.({ name: itemName, desc }, rt.E.state);
}

const homeTalk = runtime();
homeTalk.renderNode('ch2_home_talk');
assert(homeTalk.E.getFlag('su_mother_knows_zhou_fiance'), '问苏母近况后，应记录苏母知道周怀安婚约');
assert(homeTalk.E.hasClue('苏母知道周怀安婚约'), '问苏母近况后，应获得苏母知道周怀安婚约线索');
assert(homeTalk.E.hasClue('为情而去说法存疑'), '问苏母近况后，应获得为情而去说法存疑线索');
const homeTalkText = homeTalk.nodes.ch2_home_talk.text();
assert(homeTalkText.includes('周先生是个好人') && homeTalkText.includes('这门亲事'), '苏母近况文本应交代周怀安婚约');

const home = runtime({ items: [{ name: '苏晚亭的照片', desc: '' }] });
home.renderNode('ch2_home_showphoto');
assert(home.E.hasItem('苏晚亭的银发夹'), '向苏母出示照片后，应获得苏晚亭的银发夹');
assert(home.E.hasClue('苏母托付信物'), '向苏母出示照片后，应获得苏母托付信物线索');
assert(home.E.getFlag('su_mother_knows_zhou_fiance'), '向苏母出示照片后，也应记录苏母知道周怀安婚约');
assert(home.E.hasClue('为情而去说法存疑'), '向苏母出示照片后，应获得为情而去说法存疑线索');
const homeText = home.nodes.ch2_home_showphoto.text();
assert(homeText.includes('小银发夹'), '苏母出示照片剧情应交代银发夹');
assert(homeText.includes('周怀安') || homeText.includes('周先生'), '苏母出示照片剧情应交代周怀安');
assert(homeText.includes('未婚夫'), '苏母出示照片剧情应明确周怀安身份');

const cousin = runtime();
const cousinText = cousin.nodes.ch2_home_ask_photo.text();
assert(cousinText.includes('家族旧伤'), '表哥/远亲线应弱化成家庭旧伤');
assert(!cousinText.includes('凶手'), '表哥/远亲线不应被写成强凶手暗示');

const withoutHome = runEscape({
  flags: { found_su_at_dock: true },
});
assert(withoutHome.E.getFlag('rescued_yufang'), '无苏家凭据时仍应救出沈玉芳');
assert(!withoutHome.E.getFlag('rescued_su'), '无苏家凭据时不应设置 rescued_su');
assert(withoutHome.E.getFlag('su_rescue_failed_no_home_trust'), '无苏家凭据时应记录苏晚亭救援信任失败');
assert(withoutHome.E.getFlag('su_moved_from_dock'), '无苏家凭据时应降档为苏晚亭被转走/失之交臂');
const withoutHomeText = withoutHome.nodes.ch4_dock_escape_finish.text();
assert(withoutHomeText.includes('银发夹'), '无苏家凭据时应说明缺少银发夹信物');

const withOnlyToken = runEscape({
  flags: { found_su_at_dock: true, shown_photo_to_mother: true },
  clues: [{ name: '苏母认出照片', desc: '' }],
  items: [{ name: '苏晚亭的银发夹', desc: '' }],
});
assert(!withOnlyToken.E.getFlag('rescued_su'), '只有银发夹但未向苏晚亭出示时，不应设置 rescued_su');
assert(withOnlyToken.E.getFlag('su_rescue_failed_no_home_trust'), '银发夹未出示给苏晚亭时，应仍然触发信任失败');

const withOnlyHomeTalk = runEscape({
  flags: { found_su_at_dock: true, asked_photo: true, asked_mother_photo: true },
  clues: [{ name: '母亲证词', desc: '' }, { name: '表哥', desc: '' }, { name: '裁切的照片', desc: '' }],
});
assert(!withOnlyHomeTalk.E.getFlag('rescued_su'), '只问苏母/看墙上照片/问表哥，不应替代向苏晚亭出示信物');
assert(withOnlyHomeTalk.E.getFlag('su_rescue_failed_no_home_trust'), '没有向苏晚亭出示信物时，应仍然触发信任失败');

const withKeepsake = runtime({
  flags: { found_su_at_dock: true, shown_photo_to_mother: true },
  clues: [{ name: '苏母认出照片', desc: '' }],
  items: [{ name: '苏晚亭的银发夹', desc: '' }, { name: '三人合影', desc: '' }, { name: '陈明远的信', desc: '' }],
});
const keepsakeResult = present(withKeepsake, 'ch4_dock_who_dual', '苏晚亭的银发夹');
assert(keepsakeResult?.goto === 'ch4_su_present_keepsake', '银发夹应触发苏晚亭信任举证节点');
withKeepsake.renderNode(keepsakeResult.goto);
assert(withKeepsake.E.getFlag('presented_su_keepsake'), '出示银发夹后应设置 presented_su_keepsake');
assert(withKeepsake.E.hasClue('苏晚亭认出银发夹'), '出示银发夹后应获得苏晚亭认出银发夹线索');
const afterKeepsakeChoices = withKeepsake.choicesOf('ch4_su_present_keepsake').map(choice => choice.text || '');
assert(afterKeepsakeChoices.some(text => text.includes('核对合影') || text.includes('陈明远的信')), '出示银发夹后应允许继续核对合影/陈明远的信');
assert(afterKeepsakeChoices.some(text => text.includes('离开暗室')), '出示银发夹后也应允许立刻离开暗室');
const afterKeepsakeNode = withKeepsake.renderNode('ch4_dock_who_dual');
const afterKeepsakeValid = withKeepsake.E.state.items.filter(item => afterKeepsakeNode.onPresent?.(item, withKeepsake.E.state)).map(item => item.name);
assert(!afterKeepsakeValid.includes('苏晚亭的银发夹'), '银发夹已出示后，不应重复列出银发夹');
assert(afterKeepsakeValid.includes('三人合影'), '银发夹后仍应允许出示三人合影');
assert(afterKeepsakeValid.includes('陈明远的信'), '银发夹后仍应允许出示陈明远的信');
withKeepsake.renderNode('ch4_dock_escape_finish');
assert(withKeepsake.E.getFlag('rescued_yufang'), '出示银发夹后应救出沈玉芳');
assert(withKeepsake.E.getFlag('rescued_su'), '出示银发夹后应设置 rescued_su');
assert(!withKeepsake.E.getFlag('su_rescue_failed_no_home_trust'), '出示银发夹后不应记录信任失败');

const dualWithoutHome = runtime({ flags: { found_su_at_dock: true } });
const dualText = dualWithoutHome.nodes.ch4_dock_who_dual.text();
assert(dualText.includes('没有任何能证明你去过苏家的东西'), '暗室见到苏晚亭但无苏家信物时，应提前提示信任不足');

const dualWithToken = runtime({ flags: { found_su_at_dock: true, shown_photo_to_mother: true }, items: [{ name: '苏晚亭的银发夹', desc: '' }] });
const dualTokenText = dualWithToken.nodes.ch4_dock_who_dual.text();
assert(dualTokenText.includes('现在把它拿出来'), '暗室见到苏晚亭且有银发夹时，应提示可以出示信物');

const dualAfterPresent = runtime({ flags: { found_su_at_dock: true, presented_su_keepsake: true }, clues: [{ name: '苏晚亭认出银发夹', desc: '' }] });
const dualProofText = dualAfterPresent.nodes.ch4_dock_who_dual.text();
assert(dualProofText.includes('银发夹攥在掌心'), '已出示银发夹后，应显示信任建立回响');

const presentable = runtime({
  flags: { found_su_at_dock: true, shown_photo_to_mother: true },
  items: [
    { name: '苏晚亭的银发夹', desc: '' },
    { name: '三人合影', desc: '' },
    { name: '陈明远的信', desc: '' },
    { name: '未寄出的信', desc: '' },
    { name: '日记残页', desc: '' },
    { name: '光华货运单', desc: '' },
  ],
});
const node = presentable.renderNode('ch4_dock_who_dual');
const valid = presentable.E.state.items.filter(item => node.onPresent?.(item, presentable.E.state)).map(item => item.name);
presentable.E.state.flags = { found_su_at_dock: true, shown_photo_to_mother: true };
assert(valid.includes('苏晚亭的银发夹'), '暗室应允许出示银发夹');
assert(valid.includes('三人合影'), '暗室应允许出示三人合影');
assert(valid.includes('陈明远的信'), '暗室应允许出示陈明远的信');
assert(!valid.includes('未寄出的信'), '暗室不应再把未寄出的信列为重复可出示物品');
assert(!valid.includes('日记残页'), '暗室不应再把日记残页列为可出示物品');
assert(!valid.includes('光华货运单'), '暗室不应列出傅启元对峙用的货运单');

if (errors.length) {
  console.error('Su home trust gate smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Su home trust gate smoke passed.');
