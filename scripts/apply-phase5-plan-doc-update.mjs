#!/usr/bin/env node
import fs from 'node:fs';

function replaceOnce(source, from, to, label) {
  if (!source.includes(from)) {
    throw new Error(`Unable to find ${label} block for replacement.`);
  }
  return source.replace(from, to);
}

function lines(values) {
  return `${values.join('\n')}\n`;
}

const frameworkPath = 'docs/v1-refactor-framework.md';
const progressPath = 'docs/v1-refactor-progress.md';

let framework = fs.readFileSync(frameworkPath, 'utf8');

const oldPhase5 = lines([
  '### Phase 5：迁移高风险章节节点',
  '',
  '顺序：',
  '',
  '```text',
  'chapter-3-guanghua.js',
  'chapter-4-fusheng.js',
  'chapter-5-hospital.js',
  '```',
  '',
  '高风险节点包括：',
  '',
  '```text',
  'ch3_wrapup',
  'ch4_revisit_zhou',
  'ch4_sun_support',
  'ch4_dock_who_dual',
  'ch4_lu_confrontation',
  'ch4_dock_escape',
  '```',
  '',
  '要求：',
  '',
  '- 迁移前先看 patch 来源。',
  '- 迁移后 smoke 必须覆盖。',
  '- 不允许新增第三层 patch。',
]);

const newPhase5 = lines([
  '### Phase 5：迁移高风险章节节点',
  '',
  '顺序：',
  '',
  '```text',
  'chapter-3-guanghua.js',
  'chapter-4-fusheng.js',
  'chapter-5-hospital.js',
  '```',
  '',
  '高风险节点包括：',
  '',
  '```text',
  'ch3_wrapup',
  'ch4_revisit_zhou',
  'ch4_sun_support',
  'ch4_dock_who_dual',
  'ch4_lu_confrontation',
  'ch4_dock_escape',
  '```',
  '',
  '要求：',
  '',
  '- 迁移前先看 patch 来源。',
  '- 迁移后 smoke 必须覆盖。',
  '- 不允许新增第三层 patch。',
  '- 高风险节点必须按“小批量 runtime takeover → focused gate → removal dry-run → physical removal → workflow 收口”的顺序推进。',
  '- 每一批都必须有独立的迁移边界；不要把后续批次塞进上一批 removal script。',
  '',
  '#### Phase 5 当前后半段策略：第三章剩余节点',
  '',
  '第三章已经进入高风险后半段。后续不再按“低风险节点批量迁移”的方式推进，而是按节点责任和 patch 复杂度逐个收束。',
  '',
  '已完成并允许视为迁移样板的节点：',
  '',
  '```text',
  'ch3_school_chen_su',
  'ch3_school_weird',
  'ch3_school_yufang',
  '```',
  '',
  '推荐后续顺序：',
  '',
  '```text',
  '1. ch3_school_office',
  '2. ch3_chen_letter',
  '3. ch3_wu_present_threat / ch3_wu_present_photo',
  '4. ch3_school_teacher',
  '5. ch3_school',
  '6. ch3_wrapup',
  '```',
  '',
  '处理原则：',
  '',
  '- `ch3_school_office` 可作为下一批优先对象，但必须检查关键证据、道具和 `got_chen_evidence` flag。',
  '- `ch3_chen_letter` 应在办公室节点稳定后迁移，因为它依赖办公室搜证后的叙事出口。',
  '- `ch3_wu_present_threat` 与 `ch3_wu_present_photo` 属于举证结果节点，必须单独处理，不能混入普通学校节点批次。',
  '- `ch3_school_teacher` 含 `onPresent`，应等两个举证结果节点稳定后再迁。',
  '- `ch3_school` 是光华小学入口 hub，受多个 location / region / flow 模块影响，不能提前迁。',
  '- `ch3_wrapup` 是结案和结局前置 hub，必须最后作为专项迁移，不得混入普通节点迁移。',
  '',
  '`ch3_wrapup` 专项迁移前必须补充：',
  '',
  '```text',
  'wrapup audit',
  'wrapup contract',
  'wrapup runtime gate',
  '结局出口检查',
  '证据条件检查',
  '质量门检查',
  '旧存档兼容检查',
  '```',
]);

framework = replaceOnce(framework, oldPhase5, newPhase5, 'Phase 5 framework');
fs.writeFileSync(frameworkPath, framework, 'utf8');

let progress = fs.readFileSync(progressPath, 'utf8');
const marker = '## Current next step\n\n';
const currentNextStep = lines([
  '## Current next step',
  '',
  'Next step: migrate the remaining Chapter 3 nodes in high-risk order.',
  '',
  'Current completed Chapter 3 physical removals:',
  '',
  '```text',
  'ch3_school_chen_su',
  'ch3_school_weird',
  'ch3_school_yufang',
  '```',
  '',
  'Current story.js physical removal footprint:',
  '',
  '```text',
  'src/story.js: -693 lines',
  '```',
  '',
  'Recommended next migration target:',
  '',
  '```text',
  'ch3_school_office',
  '```',
  '',
  'Reason:',
  '',
  '```text',
  '1. no onPresent;',
  '2. no dynamic choices in the legacy base node;',
  '3. gives key evidence and items, so it needs a dedicated runtime gate;',
  '4. outbound targets are limited to ch3_chen_letter and ch3_wrapup;',
  '5. it should be migrated before ch3_chen_letter.',
  '```',
  '',
  'Do not migrate `ch3_wrapup` yet. It must remain the final Chapter 3 专项迁移对象.',
  '',
]);

if (!progress.includes(marker)) {
  throw new Error('Unable to find progress current next step marker.');
}
const before = progress.slice(0, progress.indexOf(marker));
const afterOld = progress.slice(progress.indexOf(marker) + marker.length);
const nextMajor = afterOld.indexOf('\n## Chapter 3 migration rule');
if (nextMajor === -1) {
  throw new Error('Unable to find progress Chapter 3 migration rule marker.');
}
const after = afterOld.slice(nextMajor + 1);
progress = before + currentNextStep + after;
fs.writeFileSync(progressPath, progress, 'utf8');

console.log('Phase 5 plan documentation updated.');
