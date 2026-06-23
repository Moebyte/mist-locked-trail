#!/usr/bin/env node
// Checks that every .js file in src/story-modules/ is registered in src/story-modules.js
// and that no registered path references a missing file.
// Run: node scripts/check-modules-manifest.mjs

import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const modulesDir = path.join(repoRoot, 'src', 'story-modules');
const manifestPath = path.join(repoRoot, 'src', 'story-modules.js');

// Read the manifest JS to extract the modules array
const manifestContent = fs.readFileSync(manifestPath, 'utf8');
const registered = [];
const re = /['"]src\/story-modules\/([^'"]+)['"]/g;
let match;
while ((match = re.exec(manifestContent)) !== null) {
  registered.push(match[1]);
}

// Read the filesystem
const onDisk = fs.readdirSync(modulesDir)
  .filter(f => f.endsWith('.js'))
  .sort();

const registeredSet = new Set(registered);
const onDiskSet = new Set(onDisk);

let exitCode = 0;

// Files on disk but not in manifest
for (const f of onDisk) {
  if (!registeredSet.has(f)) {
    console.error(`MISSING: src/story-modules/${f} exists on disk but is not registered in story-modules.js`);
    exitCode = 1;
  }
}

// Files in manifest but not on disk
for (const f of registered) {
  if (!onDiskSet.has(f)) {
    console.error(`STALE: src/story-modules/${f} is registered in story-modules.js but does not exist on disk`);
    exitCode = 1;
  }
}

if (exitCode === 0) {
  console.log(`OK: All ${onDisk.length} story-module files are registered in story-modules.js`);
} else {
  process.exit(exitCode);
}
