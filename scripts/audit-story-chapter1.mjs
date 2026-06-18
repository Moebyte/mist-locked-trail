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

const chapter1Ids = nodes
  .map(node => node.id)
  .filter(id => id.startsWith('ch1_'));

const candidateIds = new Set(['ch1_open', 'ch1_ask', 'ch1_take']);
const rows = [];
for (const node of nodes.filter(item => item.id.startsWith('ch1_'))) {
  const patchSources = moduleSources
    .filter(mod => mod.source.includes(node.id))
    .map(mod => mod.rel);
  const hasEffect = /\beffect\s*:/.test(node.body);
  const hasDynamicChoices = /\bchoices\s*:\s*\(/.test(node.body);
  const isHub = /goto:\s*['"][^'"]+['"]/g.test(node.body) && (node.body.match(/goto:\s*['"][^'"]+['"]/g) || []).length >= 3;
  const risk = patchSources.length > 1 || hasDynamicChoices || isHub ? 'high' : hasEffect || patchSources.length === 1 ? 'medium' : 'low';
  rows.push({
    id: node.id,
    candidate: candidateIds.has(node.id),
    risk,
    hasEffect,
    hasDynamicChoices,
    patchSources,
  });
}

const missingCandidates = [...candidateIds].filter(id => !chapter1Ids.includes(id));
if (missingCandidates.length) {
  console.error(`Chapter 1 audit failed: missing candidate nodes: ${missingCandidates.join(', ')}`);
  process.exit(1);
}

console.log(`Chapter 1 audit passed: ${chapter1Ids.length} ch1_* nodes found.`);
console.log('Recommended Phase 4 first batch:');
for (const row of rows.filter(item => item.candidate)) {
  const patches = row.patchSources.length ? row.patchSources.join(', ') : 'none';
  console.log(`- ${row.id} | risk=${row.risk} | effect=${row.hasEffect ? 'yes' : 'no'} | dynamicChoices=${row.hasDynamicChoices ? 'yes' : 'no'} | patchSources=${patches}`);
}

const nonCandidates = rows.filter(item => !item.candidate);
if (nonCandidates.length) {
  console.log('Other ch1_* nodes not in first batch:');
  for (const row of nonCandidates) {
    const patches = row.patchSources.length ? row.patchSources.join(', ') : 'none';
    console.log(`- ${row.id} | risk=${row.risk} | patchSources=${patches}`);
  }
}
