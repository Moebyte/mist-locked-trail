#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const repoRoot = process.cwd();
const checks = [
  'scripts/check-story-modules.mjs',
  'scripts/audit-story-chapter1.mjs',
  'scripts/check-story-endings.mjs',
  'scripts/audit-story-endings.mjs',
  'scripts/check-story-chapter2-runtime.mjs',
  'scripts/audit-story-chapter3.mjs',
  'scripts/check-story-chapter3-runtime.mjs',
  'scripts/remove-migrated-chapter3-first-batch-from-story.mjs',
  'scripts/remove-migrated-chapter3-second-batch-from-story.mjs',
];

const failures = [];

for (const rel of checks) {
  console.log(`\n==> node ${rel}`);
  const result = spawnSync(process.execPath, [path.join(repoRoot, rel)], {
    cwd: repoRoot,
    stdio: 'inherit',
  });
  if (result.status !== 0) failures.push(rel);
}

if (failures.length) {
  console.error('\nFull story refactor check failed:');
  for (const rel of failures) console.error(`- ${rel}`);
  process.exit(1);
}

console.log('\nFull story refactor check passed.');
