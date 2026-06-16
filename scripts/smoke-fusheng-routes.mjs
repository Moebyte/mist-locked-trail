#!/usr/bin/env node
import { loadStoryRuntime } from './story-harness.mjs';

const reports = [];
const errors = [];
const basePressure = { heat: 0, deadline: { day: 2, hour: 23, minute: 0 } };

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function test(name, fn) {
  try {
    fn();
    reports.push(`PASS ${name}`);
  } catch (err) {
    errors.push(`${name}: ${err.message}`);
  }
}

function runtime(initialState = {}) {
  return loadStoryRuntime({
    initialState: {
      inGameTime: { day: 2, hour: 14, minute: 0 },
      pressure: clone(basePressure),
      ...initialState,
    },
  });
}

function choiceTexts(rt, sceneId) {
  return rt.choicesOf(sceneId).map(choice => choice.text || '');
}

function hasChoiceTo(rt, sceneId, target) {
  return rt.choicesOf(sceneId).some(choice => choice.goto === target || (typeof choice.goto === 'function' && choice.goto(rt.E.state) === target));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

test('未举证时，苏州河入口不能直接等老孙带人', () => {
  const rt = runtime();
  rt.renderNode('ch4_suzhou_creek');
  const texts = choiceTexts(rt, 'ch4_suzhou_creek');
  assert(!hasChoiceTo(rt, 'ch4_suzhou_creek', 'ch4_dock_wait'), '未举证却出现 ch4_dock_wait');
  assert(texts.some(text => text.includes('回巡捕房找老孙')), '缺少回巡捕房找老孙的选项');
});

test('未举证时，后门观察后也不能直接等老孙带人', () => {
  const rt = runtime();
  rt.renderNode('ch4_dock_watch');
  const texts = choiceTexts(rt, 'ch4_dock_watch');
  assert(!hasChoiceTo(rt, 'ch4_dock_watch', 'ch4_dock_wait'), '后门观察后未举证却出现 ch4_dock_wait');
  assert(texts.some(text => text.includes('回巡捕房找老孙')), '缺少带观察情况回巡捕房的选项');
});

test('强行进入等待支援时，不会自动批准老孙支援', () => {
  const rt = runtime({ inGameTime: { day: 2, hour: 21, minute: 0 } });
  rt.renderNode('ch4_dock_wait');
  assert(!rt.E.getFlag('sun_support_available'), '强行进入 ch4_dock_wait 后自动设置了 sun_support_available');
  assert(!rt.E.getFlag('sun_wait_support'), '强行进入 ch4_dock_wait 后自动设置了 sun_wait_support');
  assert(!rt.E.getFlag('sun_support_in_action'), '强行进入 ch4_dock_wait 后自动设置了 sun_support_in_action');
  assert(rt.E.state.inGameTime.hour === 21 && rt.E.state.inGameTime.minute === 0, '未批准支援时不应消耗等待时间');
  const texts = choiceTexts(rt, 'ch4_dock_wait');
  assert(texts.some(text => text.includes('出示福生仓线索')), '强行等待时应引导回老孙举证');
});

test('向老孙出示福生仓地址后，才能选择便衣或调齐人手', () => {
  const rt = runtime({ items: [{ name: '福生仓地址', desc: '福生仓位于苏州河下游废弃码头第三号仓库。' }] });
  const result = rt.present('ch4_sun_support', '福生仓地址');
  assert(result && result.goto === 'ch4_sun_present_fusheng', '福生仓地址没有触发老孙举证节点');
  rt.renderNode(result.goto);
  assert(rt.E.getFlag('sun_support_available'), '举证后没有设置 sun_support_available');
  const texts = choiceTexts(rt, 'ch4_sun_present_fusheng');
  assert(texts.some(text => text.includes('只带一个便衣')), '缺少便衣路线选项');
  assert(texts.some(text => text.includes('调齐人手')), '缺少调齐人手路线选项');
});

test('便衣路线快进福生仓，但没有硬证据时只能掩护撤离', () => {
  const rt = runtime({ flags: { sun_support_available: true, sun_fast_support: true, sun_support_in_action: true, found_su_at_dock: true } });
  rt.renderNode('ch4_dock_escape');
  const texts = choiceTexts(rt, 'ch4_dock_escape');
  assert(texts.some(text => text.includes('便衣拖住傅启元')), '便衣无硬证据时应出现拖住傅启元选项');
  assert(!texts.some(text => text.includes('封住码头')), '便衣无硬证据时不应出现封住码头选项');
});

test('便衣路线拿到硬证据后，可以亮明身份压住傅启元', () => {
  const rt = runtime({
    flags: { sun_support_available: true, sun_fast_support: true, sun_support_in_action: true, found_su_at_dock: true },
    items: [{ name: '清场指令', desc: '三日内清走，别留痕迹。' }],
  });
  rt.renderNode('ch4_dock_escape');
  const texts = choiceTexts(rt, 'ch4_dock_escape');
  assert(texts.some(text => text.includes('亮明身份')), '便衣有硬证据时应能亮明身份');
  assert(!texts.some(text => text.includes('封住码头')), '便衣路线不应获得封住码头的强控场选项');
});

test('调齐人手路线会耗时、封控，并留下码头记录', () => {
  const rt = runtime({ flags: { sun_support_available: true, sun_full_support: true, found_su_at_dock: true }, inGameTime: { day: 2, hour: 19, minute: 0 } });
  rt.renderNode('ch4_dock_wait');
  assert(rt.E.getFlag('sun_wait_support'), '调齐人手后没有设置 sun_wait_support');
  assert(rt.E.getFlag('sun_support_in_action'), '调齐人手后没有设置 sun_support_in_action');
  assert(rt.E.state.inGameTime.hour === 21 && rt.E.state.inGameTime.minute === 15, '调齐人手没有正确消耗 2 小时 15 分钟');
  rt.renderNode('ch4_dock_escape');
  const texts = choiceTexts(rt, 'ch4_dock_escape');
  assert(texts.some(text => text.includes('封住码头')), '调齐人手后应出现封住码头选项');
  assert(!texts.some(text => text.includes('亮明身份')), '调齐人手后不应再出现弱一级的亮明身份选项');
  rt.goByText('封住码头');
  assert(rt.E.getFlag('dock_blockade_record'), '傅启元对峙后没有留下码头封锁记录');
});

test('完整搜查路线能救出苏晚亭，有限搜查只得到转移痕迹', () => {
  const fast = runtime({ inGameTime: { day: 2, hour: 12, minute: 0 } });
  assert(fast.E.routeDockByPressure() === 'ch4_dock_full_search', '早到应进入完整搜查');
  assert(fast.E.routeDockDeepByPressure() === 'ch4_dock_deep_dual', '早到暗室应同时找到两人');

  const tight = runtime({ inGameTime: { day: 2, hour: 18, minute: 0 } });
  assert(tight.E.routeDockByPressure() === 'ch4_dock_limited_search', '晚到应进入有限搜查');
  assert(tight.E.routeDockDeepByPressure() === 'ch4_dock_deep_trace', '晚到暗室应只找到苏晚亭转移痕迹');
});

test('隐藏结局信件按苏晚亭是否获救切换来源', () => {
  const rescued = runtime({ flags: { rescued_su: true, rescued_yufang: true } });
  const rescuedText = rescued.nodes.end_conspiracy_detail.text();
  assert(rescuedText.includes('周怀安替苏晚亭送来一封信'), '救出苏晚亭时应由周怀安转交苏晚亭来信');
  assert(rescuedText.includes('谢谢你先找人，而不是先找凶手。——苏晚亭'), '救出苏晚亭时应保留亲笔感谢句');

  const traced = runtime({ flags: { su_moved_from_dock: true, rescued_yufang: true } });
  const tracedText = traced.nodes.end_conspiracy_detail.text();
  assert(tracedText.includes('她没有见过你'), '未救出苏晚亭时应说明她没有见过主角');
  assert(tracedText.includes('请替我谢谢那位沈先生'), '未救出苏晚亭时应通过周怀安转述感谢');
  assert(!tracedText.includes('你收到一封信。信上只有一行字'), '未救出苏晚亭时不应使用固定直接来信文案');
});

console.log('Fusheng route smoke reports:');
for (const report of reports) console.log(`- ${report}`);

if (errors.length) {
  console.error('\nFusheng route smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Fusheng route smoke passed: ${reports.length} checks.`);
