#!/usr/bin/env node
import { loadStoryRuntime } from './story-harness.mjs';

const rt = loadStoryRuntime();
const { E, nodes } = rt;
const errors = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function choiceByText(id, fragment) {
  rt.renderNode(id);
  return rt.choicesOf(id).find(choice => choice.text && choice.text.includes(fragment));
}

function runChoiceByText(id, fragment) {
  const choice = choiceByText(id, fragment);
  assert(choice, `${id} 缺少选项：${fragment}`);
  if (choice) rt.runChoice(choice, `${id}/${fragment}`);
}

rt.resetState();
runChoiceByText('ch1_open', '接下委托');
assert(E.getFlag('echo_zhou_quick_trust') === true, '周明远快速信任线未设置 echo_zhou_quick_trust');
assert(E.causalEchoSummary().some(e => e.id === 'zhou_quick_trust'), '周明远快速信任线未进入回响摘要');

rt.resetState();
runChoiceByText('ch1_ask', '好，这委托我接了');
assert(E.getFlag('echo_zhou_questioned_first') === true, '周明远谨慎追问线未设置 echo_zhou_questioned_first');

rt.resetState();
runChoiceByText('ch2_woman_detail', '我会尽力');
assert(E.getFlag('echo_yulan_promise') === true, '沈玉兰承诺线未设置 echo_yulan_promise');
assert(E.state.currentScene === 'ch2_yulan_promise_echo', '沈玉兰承诺线没有进入承诺回响节点');
E.state.flags.echo_yulan_promise = true;
const yulanPromiseText = nodes.ch4_dock_who_dual.text(E.state);
assert(yulanPromiseText.includes('我姐姐'), '沈玉兰承诺线没有在福生仓暗室回响');

rt.resetState();
runChoiceByText('ch2_woman_detail', '不能保证');
assert(E.getFlag('echo_yulan_distance') === true, '沈玉兰边界线未设置 echo_yulan_distance');
E.state.flags.echo_yulan_distance = true;
const yulanDistanceText = nodes.ch4_dock_who_dual.text(E.state);
assert(yulanDistanceText.includes('怎么回答她'), '沈玉兰边界线没有在福生仓暗室回响');

rt.resetState();
runChoiceByText('ch2_police_present', '我信你');
assert(E.getFlag('echo_sun_private_trust') === true, '老孙私下默契线未设置 echo_sun_private_trust');
E.state.flags.echo_sun_private_trust = true;
const sunPrivateText = nodes.ch4_sun_support.text(E.state);
assert(sunPrivateText.includes('别走明面'), '老孙私下默契线没有在福生仓支援节点回响');

rt.resetState();
runChoiceByText('ch2_police_present', '巡捕房这次');
assert(E.getFlag('echo_sun_public_pressure') === true, '老孙公事压力线未设置 echo_sun_public_pressure');
assert(E.state.currentScene === 'ch2_sun_pressure_echo', '老孙公事压力线没有进入压力回响节点');
E.state.flags.echo_sun_public_pressure = true;
const sunPressureText = nodes.ch4_sun_support.text(E.state);
assert(sunPressureText.includes('不装'), '老孙公事压力线没有在福生仓支援节点回响');

if (errors.length) {
  console.error('\nCausal echo smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Causal echo smoke passed.');
