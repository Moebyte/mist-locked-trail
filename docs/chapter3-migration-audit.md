# Chapter 3 Migration Audit

Chapter 3 belongs to Phase 5 in `docs/v1-refactor-framework.md`, so it must not be migrated as a low-risk batch.

This document records the safe pre-migration process for `ch3_*` nodes.

## Current rule

Do not move or physically remove any `ch3_*` node until the audit output has been reviewed.

Chapter 3 migration must follow this order:

```text
1. audit remaining ch3_* nodes in src/story.js;
2. identify patch sources in src/story-modules/;
3. classify low / medium / high risk nodes;
4. choose one small first batch;
5. add runtime takeover for that batch;
6. add a focused Chapter 3 runtime gate;
7. only then consider physical removal for that selected batch.
```

## Audit command

```bash
node scripts/audit-story-chapter3.mjs
```

The same audit is included in:

```bash
node scripts/check-story-refactor-full.mjs
```

and in GitHub Actions:

```text
Actions → Story Refactor Full Check
```

## What the audit reports

The audit reports each remaining `ch3_*` node in `src/story.js` with:

```text
id
source line range
approximate character footprint
whether it has effect
whether it has onPresent
whether it has dynamic choices
number of goto edges
runtime patch sources
recommended migration batch
```

## Audit findings

The current Chapter 3 surface is smaller than Chapter 2, but it is more risky because `src/story-modules/guanghua-school-flow-polish.js` owns much of the final runtime behavior.

High-risk or patch-owned nodes:

```text
ch3_school                  patched hub choices
ch3_school_teacher          patched onPresent and choices
ch3_school_yufang           patched choices
ch3_school_weird            patched choices
ch3_school_office           patched text/effect/choices
ch3_chen_letter             patched choices
ch3_wu_present_threat       patched effect/choices
ch3_wu_present_photo        patched effect/choices
ch3_wrapup                  patched gate choices; high-risk hub
```

Additional runtime-only nodes are created by `guanghua-school-flow-polish.js` and should not be treated as legacy `story.js` removal candidates:

```text
ch3_school_confront_wu
ch3_wu_present_university
ch3_school_after_confront
```

The safest first target is therefore a single unpatched node:

```text
ch3_school_chen_su
```

## Batch meaning

```text
batch-1: low-risk nodes, usually no dynamic choices, no onPresent, no multi-patch ownership
batch-2: medium-risk nodes, possible effect or one patch source, but not a major hub
batch-3: high-risk nodes, dynamic choices, onPresent, hub behavior, or multiple patch sources
```

## First batch selection rule

The first Chapter 3 migration batch should be small and boring.

Prefer nodes that satisfy:

```text
risk=low or small medium
patchSources=none
onPresent=no
dynamicChoices=no
goto count <= 3
```

Avoid in the first batch:

```text
ch3_wrapup
hub nodes
nodes with deduction or conclusion routing
nodes patched by story-modules
nodes that write core truth flags
```

## Required before runtime takeover

Before adding `src/story-chapters/chapter-3-guanghua.js`, document the selected first batch in this file under `Selected first batch`.

## Selected first batch

```text
ch3_school_chen_su
```

Reason:

```text
1. no onPresent;
2. no dynamic choices;
3. no known story-modules patch source;
4. not a hub;
5. only writes the localized clue 苏晚亭与陈明远 and flag chen_su_link;
6. choices point back into already-existing Chapter 3 nodes.
```

Target file:

```text
src/story-chapters/chapter-3-guanghua.js
```

Required companion files before deletion:

```text
src/story-chapters/chapter-3-guanghua-contract.js
scripts/check-story-chapter3-runtime.mjs
```

Physical deletion from `src/story.js` is not allowed until the focused Chapter 3 runtime gate passes.
