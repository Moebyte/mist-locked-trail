#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const storyRel = 'src/story.js';
const storyPath = path.join(repoRoot, storyRel);
const write = process.argv.includes('--write');

const requiredModules = [
  'src/story-chapters/chapter-3-guanghua.js',
  'src/story-chapters/chapter-3-guanghua-contract.js',
];

const migratedNodes = [
  'ch3_school_yufang',
];

function read(rel) {
  return fs.readFileSync(path.join(repoRoot, rel), 'utf8');
}

function exists(rel) {
  return fs.existsSync(path.join(repoRoot, rel));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findNodeRange(source, id) {
  const pattern = new RegExp(`^\\s{2}${escapeRegExp(id)}:\\s*{`, 'm');
  const match = pattern.exec(source);
  if (!match) return null;

  const start = match.index;
  const afterStart = start + match[0].length;
  let depth = 1;
  let inString = null;
  let escaped = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = afterStart; i < source.length; i += 1) {
    const ch = source[i];
    const next = source[i + 1];

    if (inLineComment) {
      if (ch === '\n') inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false;
        i += 1;
      }
      continue;
    }
    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === inString) {
        inString = null;
      }
      continue;
    }

    if (ch === '/' && next === '/') {
      inLineComment = true;
      i += 1;
      continue;
    }
    if (ch === '/' && next === '*') {
      inBlockComment = true;
      i += 1;
      continue;
    }
    if (ch === '\'' || ch === '"' || ch === '`') {
      inString = ch;
      continue;
    }
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        let end = i + 1;
        while (source[end] === ' ' || source[end] === '\t') end += 1;
        if (source[end] === ',') end += 1;
        if (source[end] === '\r') end += 1;
        if (source[end] === '\n') end += 1;
        return { id, start, end };
      }
    }
  }

  throw new Error(`Unable to find end of node ${id}`);
}

for (const rel of requiredModules) {
  if (!exists(rel)) {
    console.error(`Chapter 3 Yufang removal failed: required module missing: ${rel}`);
    process.exit(1);
  }
}

const manifest = read('src/story-modules.js');
for (const rel of requiredModules) {
  if (!manifest.includes(rel)) {
    console.error(`Chapter 3 Yufang removal failed: required module is not loaded: ${rel}`);
    process.exit(1);
  }
}

const source = fs.readFileSync(storyPath, 'utf8');
const ranges = migratedNodes.map(id => findNodeRange(source, id));
const found = ranges.filter(Boolean);
const missing = migratedNodes.filter((id, index) => !ranges[index]);

if (!found.length && missing.length === migratedNodes.length) {
  console.log(`Chapter 3 Yufang removal check passed: no migrated Yufang node definitions remain in ${storyRel}.`);
  process.exit(0);
}

if (found.length !== migratedNodes.length) {
  console.error('Chapter 3 Yufang removal failed: partial removal detected.');
  console.error(`Found: ${found.map(item => item.id).join(', ') || 'none'}`);
  console.error(`Missing: ${missing.join(', ') || 'none'}`);
  process.exit(1);
}

const sortedRanges = found.slice().sort((a, b) => a.start - b.start);
for (let i = 1; i < sortedRanges.length; i += 1) {
  if (sortedRanges[i].start < sortedRanges[i - 1].end) {
    console.error(`Chapter 3 Yufang removal failed: overlapping ranges for ${sortedRanges[i - 1].id} and ${sortedRanges[i].id}`);
    process.exit(1);
  }
}

if (!write) {
  console.log(`Chapter 3 Yufang removal dry-run: ${sortedRanges.length} node(s) can be removed from ${storyRel}.`);
  for (const range of sortedRanges) {
    const startLine = source.slice(0, range.start).split('\n').length;
    const endLine = source.slice(0, range.end).split('\n').length;
    console.log(`- ${range.id}: lines ${startLine}-${endLine}`);
  }
  console.log('Run with --write to apply.');
  process.exit(0);
}

let nextSource = source;
for (const range of sortedRanges.slice().reverse()) {
  nextSource = nextSource.slice(0, range.start) + nextSource.slice(range.end);
}
fs.writeFileSync(storyPath, nextSource, 'utf8');
console.log(`Removed ${sortedRanges.length} migrated Chapter 3 Yufang node definition(s) from ${storyRel}.`);
