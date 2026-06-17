#!/usr/bin/env node
import { loadStoryRuntime } from './story-harness.mjs';

const rt = loadStoryRuntime();
const { E } = rt;
const errors = [];

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function reset(flags = {}, items = [], clues = []) {
  rt.resetState({ flags, items, clues });
}

function score() {
  return E.truthCompletenessTier();
}

const clearanceItem = [{ name: '清场指令', desc: '' }];
const waybillItem = [{ name: '光华货运单', desc: '' }];
const fullItems = [...clearanceItem, ...waybillItem];

function expect(label, flags, items, expectedScore, expectedKey) {
  reset(flags, items);
  const got = score();
  assert(got.score === expectedScore, `${label}: truth score 应为 ${expectedScore}，实际 ${JSON.stringify(got)}`);
  if (expectedKey) assert(got.key === expectedKey, `${label}: tier 应为 ${expectedKey}，实际 ${JSON.stringify(got)}`);
}

// 用户指定的真相底分矩阵。
expect(
  '双证人 + 全物证',
  { rescued_yufang: true, rescued_su: true, found_su_at_dock: true },
  fullItems,
  10,
  'complete'
);
expect(
  '单证人 + 全物证',
  { rescued_yufang: true },
  fullItems,
  8,
  'solid'
);
expect(
  '双证人 + 单物证',
  { rescued_yufang: true, rescued_su: true, found_su_at_dock: true },
  clearanceItem,
  8,
  'solid'
);
expect(
  '单证人 + 单物证',
  { rescued_yufang: true },
  clearanceItem,
  7,
  'partial'
);
expect(
  '双证人 + 零物证',
  { rescued_yufang: true, rescued_su: true, found_su_at_dock: true },
  [],
  6,
  'partial'
);
expect(
  '零证人 + 全物证',
  {},
  fullItems,
  6,
  'partial'
);

// 医院参数：稳定医院/医生记录可补强，但不能突破证人结构上限。
expect(
  '单证人 + 全物证 + 医生记录',
  { rescued_yufang: true, hospital_doctor_record: true },
  fullItems,
  9,
  'solid'
);
expect(
  '零证人 + 全物证 + 医生记录不能突破零证人上限',
  { hospital_doctor_record: true },
  fullItems,
  6,
  'partial'
);

// 医院紧张/失控会扣分并封顶。
expect(
  '双证人 + 全物证 + 医院紧张',
  {
    rescued_yufang: true,
    rescued_su: true,
    found_su_at_dock: true,
    hospital_early_lu: true,
    hospital_interrogate_yufang: true,
  },
  fullItems,
  9,
  'solid'
);
expect(
  '双证人 + 全物证 + 医院失控',
  {
    rescued_yufang: true,
    rescued_su: true,
    found_su_at_dock: true,
    hospital_force_su_identify: true,
  },
  fullItems,
  7,
  'partial'
);

if (errors.length) {
  console.error('Hospital truth score smoke failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Hospital truth score smoke passed.');
