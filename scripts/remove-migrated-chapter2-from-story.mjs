#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const storyRel = 'src/story.js';
const storyPath = path.join(repoRoot, storyRel);
const write = process.argv.includes('--write');
const errors = [];

const migratedChapter2Ids = [
  'ch2_university',
  'ch2_univ_matron',
  'ch2_univ_door',
  'ch2_univ_paper',
  'ch2_leave_univ',
  'ch2_police',
  'ch2_police_file',
  'ch2_police_alt',
  'ch2_police_present',
  'ch2_police_wang',
  'ch2_home',
  'ch2_home_talk',
  'ch2_home_photo',
  'ch2_home_ask_photo',
  'ch2_home_showphoto',
  'ch2_leave_home',
  'ch2_frenchtown',
  'ch2_building_stakeout',
  'ch2_tail',
  'ch2_tea_monitor',
  'ch2_talk_woman',
  'ch2_woman_detail',
  'ch2_building_enter',
  'ch2_ask_landlord',
  'ch2_landlord_map',
  'ch2_203_door',
  'ch2_203_search',
];

const requiredChapterFiles = [
  'src/story-chapters/chapter-2-university-entry.js',
  'src/story-chapters/chapter-2-university-entry-contract.js',
  'src/story-chapters/chapter-2-home-xuehua.js',
  'src/story-chapters/chapter-2-home-xuehua-contract.js',
  'src/story-chapters/chapter-2-home-entry.js',
  'src/story-chapters/chapter-2-home-entry-contract.js',
  'src/story-chapters/chapter-2-home-fixed.js',
  'src/story-chapters/chapter-2-home-fixed-contract.js',
  'src/story-chapters/chapter-2-home-talk.js',
  'src/story-chapters/chapter-2-home-talk-contract.js',
  'src/story-chapters/chapter-2-leave-home.js',
  'src/story-chapters/chapter-2-leave-home-contract.js',
  'src/story-chapters/chapter-2-police-dynamic.js',
  'src/story-chapters/chapter-2-police-dynamic-contract.js',
  'src/story-chapters/chapter-2-frenchtown-entry.js',
  'src/story-chapters/chapter-2-frenchtown-entry-contract.js',
  'src/story-chapters/chapter-2-frenchtown-tail.js',
  'src/story-chapters/chapter-2-frenchtown-tail-contract.js',
  'src/story-chapters/chapter-2-building-enter.js',
  'src/story-chapters/chapter-2-building-enter-contract.js',
  'src/story-chapters/chapter-2-xuehua-203.js',
  'src/story-chapters/chapter-2-xuehua-203-contract.js',
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

function nodeDefinitionPattern(id) {
  return new RegExp(`^\\s*${escapeRegExp(id)}:\\s*{`, 'm');
}

function findNodeBlock(source, id) {
  const pattern = nodeDefinitionPattern(id);
  const match = pattern.exec(source);
  if (!match) return null;

  let braceIndex = source.indexOf('{', match.index);
  if (braceIndex < 0) return null;

  let depth = 0;
  let quote = null;
  let templateDepth = 0;
  let escaped = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = braceIndex; i < source.length; i += 1) {
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

    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (quote === '`' && ch === '$' && next === '{') {
        templateDepth += 1;
        i += 1;
        continue;
      }
      if (quote === '`' && ch === '}' && templateDepth > 0) {
        templateDepth -= 1;
        continue;
      }
      if (ch === quote && templateDepth === 0) quote = null;
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
    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
      continue;
    }
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        let end = i + 1;
        while (source[end] === ' ' || source[end] === '\t') end += 1;
        if (source[end] === ',') end += 1;
        while (source[end] === ' ' || source[end] === '\t') end += 1;
        if (source[end] === '\r') end += 1;
        if (source[end] === '\n') end += 1;
        return { id, start: match.index, end, text: source.slice(match.index, end) };
      }
    }
  }
  return null;
}

function lineNumber(source, index) {
  return source.slice(0, index).split('\n').length;
}

for (const rel of requiredChapterFiles) {
  if (!exists(rel)) errors.push(`missing required migrated chapter file: ${rel}`);
}

const modulesSource = read('src/story-modules.js');
for (const rel of requiredChapterFiles) {
  if (!modulesSource.includes(rel)) errors.push(`story-modules.js does not load ${rel}`);
}

let storySource = read(storyRel);
const blocks = [];
const missing = [];
for (const id of migratedChapter2Ids) {
  const block = findNodeBlock(storySource, id);
  if (!block) missing.push(id);
  else blocks.push(block);
}

if (errors.length) {
  console.error('\nChapter 2 removal preflight failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

if (blocks.length === 0) {
  console.log(`Chapter 2 removal check passed: no migrated Chapter 2 node definitions remain in ${storyRel}.`);
  process.exit(0);
}

if (missing.length) {
  console.error('\nChapter 2 removal preflight failed: partial removal detected.');
  console.error(`${blocks.length} migrated nodes still exist, but ${missing.length} are already missing.`);
  for (const id of missing) console.error(`- missing: ${id}`);
  process.exit(1);
}

const sorted = [...blocks].sort((a, b) => a.start - b.start);
for (let i = 1; i < sorted.length; i += 1) {
  if (sorted[i].start < sorted[i - 1].end) {
    errors.push(`overlapping removal ranges: ${sorted[i - 1].id} and ${sorted[i].id}`);
  }
}

if (errors.length) {
  console.error('\nChapter 2 removal preflight failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

let nextSource = storySource;
for (const block of [...sorted].reverse()) {
  nextSource = nextSource.slice(0, block.start) + nextSource.slice(block.end);
}

const survivors = migratedChapter2Ids.filter(id => nodeDefinitionPattern(id).test(nextSource));
if (survivors.length) {
  console.error('\nChapter 2 removal postcheck failed:');
  for (const id of survivors) console.error(`- ${id} would still be defined in ${storyRel}`);
  process.exit(1);
}

console.log(`Chapter 2 removal preflight passed: ${blocks.length} nodes can be removed from ${storyRel}.`);
for (const block of sorted) {
  const startLine = lineNumber(storySource, block.start);
  const endLine = lineNumber(storySource, block.end);
  console.log(`- ${block.id}: lines ${startLine}-${endLine}, ${block.end - block.start} chars`);
}

if (!write) {
  console.log('\nDry run only. Re-run with --write after runtime audits pass.');
  process.exit(0);
}

fs.writeFileSync(storyPath, nextSource);
console.log(`\nUpdated ${storyRel}: removed ${blocks.length} migrated chapter 2 node definitions.`);
