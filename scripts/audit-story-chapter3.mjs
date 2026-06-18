#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const storyRel = 'src/story.js';
const modulesDir = 'src/story-modules';
const storySource = fs.readFileSync(path.join(repoRoot, storyRel), 'utf8');

function listModuleFiles() {
  if (!fs.existsSync(path.join(repoRoot, modulesDir))) return [];
  return fs.readdirSync(path.join(repoRoot, modulesDir))
    .filter(name => name.endsWith('.js'))
    .map(name => path.join(modulesDir, name).replaceAll('\\', '/'));
}

const nodeMatches = [...storySource.matchAll(/^\s{2}([a-z0-9_]+):\s*{/gm)];
const nodes = nodeMatches.map((match, index) => {
  const id = match[1];
  const start = match.index;
  const end = index + 1 < nodeMatches.length ? nodeMatches[index + 1].index : storySource.lastIndexOf('\n};');
  const body = storySource.slice(start, end);
  return { id, start, end, body };
});

const moduleSources = listModuleFiles().map(rel => ({
  rel,
  source: fs.readFileSync(path.join(repoRoot, rel), 'utf8'),
}));

function countMatches(source, pattern) {
  return (source.match(pattern) || []).length;
}

function lineNumber(index) {
  return storySource.slice(0, index).split('\n').length;
}

function classify(node, patchSources) {
  const hasEffect = /\beffect\s*:/.test(node.body);
  const hasOnPresent = /\bonPresent\s*:/.test(node.body);
  const hasDynamicChoices = /\bchoices\s*:\s*\(/.test(node.body);
  const gotoCount = countMatches(node.body, /goto:\s*['"][^'"]+['"]/g);
  const hasWhen = /\bwhen\s*:/.test(node.body);
  const hasComplexState = /E\.(getFlag|hasClue|hasItem|setFlag|addClue|addItem|discoverRelation|addContact)\b/.test(node.body);
  const isHub = gotoCount >= 3 || hasDynamicChoices;

  let risk = 'low';
  if (patchSources.length > 1 || hasDynamicChoices || hasOnPresent || isHub) risk = 'high';
  else if (patchSources.length === 1 || hasEffect || hasWhen || hasComplexState) risk = 'medium';

  let batch = 'later';
  if (risk === 'low') batch = 'batch-1';
  else if (risk === 'medium' && !hasOnPresent && !hasDynamicChoices && patchSources.length <= 1) batch = 'batch-2';
  else batch = 'batch-3';

  return { hasEffect, hasOnPresent, hasDynamicChoices, hasWhen, gotoCount, isHub, risk, batch };
}

const chapter3Nodes = nodes.filter(node => node.id.startsWith('ch3_'));
if (!chapter3Nodes.length) {
  console.log('Chapter 3 audit passed: no ch3_* nodes remain in src/story.js.');
  process.exit(0);
}

const rows = chapter3Nodes.map(node => {
  const patchSources = moduleSources
    .filter(mod => mod.source.includes(node.id))
    .map(mod => mod.rel);
  return {
    id: node.id,
    lines: `${lineNumber(node.start)}-${lineNumber(node.end)}`,
    chars: node.end - node.start,
    patchSources,
    ...classify(node, patchSources),
  };
});

console.log(`Chapter 3 audit passed: ${rows.length} ch3_* nodes remain in ${storyRel}.`);
console.log('\nRecommended migration batches:');
for (const batch of ['batch-1', 'batch-2', 'batch-3']) {
  const items = rows.filter(row => row.batch === batch);
  console.log(`\n${batch}: ${items.length} node(s)`);
  for (const row of items) {
    const patches = row.patchSources.length ? row.patchSources.join(', ') : 'none';
    console.log(`- ${row.id} | risk=${row.risk} | lines=${row.lines} | chars=${row.chars} | effect=${row.hasEffect ? 'yes' : 'no'} | onPresent=${row.hasOnPresent ? 'yes' : 'no'} | dynamicChoices=${row.hasDynamicChoices ? 'yes' : 'no'} | goto=${row.gotoCount} | patchSources=${patches}`);
  }
}

const totalChars = rows.reduce((sum, row) => sum + row.chars, 0);
console.log(`\nTotal removable Chapter 3 candidate footprint: ${totalChars} chars in ${rows.length} node(s).`);
console.log('Use batch-1 for the first low-risk physical migration. Do not remove legacy nodes until runtime takeover and a focused Chapter 3 gate pass.');
